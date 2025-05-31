import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Req,
  UseGuards,
  Query,
  NotFoundException,
  Request,
  Put,
  Delete,
  Res,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { LinkStatService } from '../link-stat/link-stat.service';
import { Prisma } from '@prisma/client';
import {
  CreateReportBodyDto,
  FullReportDto,
  ReportDto,
  ReportModelDto,
  ReportsPaginatedDto,
  ReportWithPermissionsDto,
  RequestUserPayloadDto,
  UpdateReportBodyDto,
} from '@stud-short-url/common';
import { parse, isValid, addMinutes, format } from 'date-fns';
import { HasReportViewPermissionGuard } from '../report-permission/has-report-view-permission.guard';
import { HasReportEditPermissionGuard } from '../report-permission/has-report-edit-permission.guard';
import { IsReportAdminGuard } from '../report-permission/is-report-admin.guard';
import { Response } from 'express';
import { createObjectCsvStringifier } from 'csv-writer';
import * as ExcelJS from 'exceljs';
import { longUrlFromShortKey } from '../shared/long-url-from-short-key';
import { inspect } from 'util';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly prisma: PrismaService,
    private readonly linkStatService: LinkStatService
  ) {}

  @Get()
  async findAll(
    @Query('sortBy')
    sortBy: 'updatedAt' | 'createdAt' | 'name' | undefined,

    @Query('sortDirection')
    direction: 'asc' | 'desc' | undefined,

    @Query('search')
    search = '',

    @Query('page')
    page = 1,

    @Query('limit')
    limit = 5,

    @Request() req: any
  ): Promise<ReportsPaginatedDto> {
    const user: RequestUserPayloadDto = req.user;

    const allSorted = await this.reportService.findAllSorted({
      sortBy,
      direction,
      search,
      page,
      limit,
      userId: user.sub,
    });

    return {
      data: allSorted.data.map((report) => {
        const dto = this.reportService.reportApiToDto(report);
        return {
          ...dto,
          createdAt: dto.createdAt,
          customStart: dto.customStart,
          customEnd: dto.customEnd,
        };
      }),
      totalPages: allSorted.totalPages,
      currentPage: allSorted.currentPage,
    };
  }

  @Get(':reportId')
  @UseGuards(HasReportViewPermissionGuard)
  async getReportByShortKey(
    @Param('reportId') reportId: string,
    @Request() req: any
  ): Promise<ReportWithPermissionsDto> {
    const user: RequestUserPayloadDto = req.user;

    const report = await this.reportService.getReportById({
      reportId,
      userId: user.sub,
    });

    if (!report) {
      throw new NotFoundException('report not found');
    }

    return report;
  }

  @Post()
  async create(
    @Req() req: any,
    @Body() body: CreateReportBodyDto
  ): Promise<ReportDto> {
    const user: RequestUserPayloadDto = req.user;

    const userId = user.sub;

    const report = await this.reportService.createReport(
      userId,
      body.name,
      body.shortLinkIds,
      body.chartType,
      body.timeScale,
      body.periodType,
      body.customStart,
      body.customEnd
    );

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const dto = this.reportService.reportApiToDto(report);

    return dto;
  }

  @UseGuards(HasReportEditPermissionGuard)
  @Put(':reportId')
  async updateLinkByShortKey(
    @Param('reportId') reportId: string,
    @Body() reportData: UpdateReportBodyDto
  ): Promise<ReportModelDto> {
    const report = await this.reportService.updateReport({
      where: { id: reportId },
      data: {
        name: reportData.name,
        timeScale: reportData.timeScale,
        chartType: reportData.chartType,
        periodType: reportData.periodType,
        customStart: reportData.customStart,
        customEnd: reportData.customEnd,
        shortLinks: {
          deleteMany: {}, // удаляет все существующие связи
          create: reportData.shortLinkIds.map((shortLinkId) => ({
            shortLink: {
              connect: { id: shortLinkId },
            },
          })),
        },
      },
    });

    const dto: ReportModelDto = {
      id: report.id,
      name: report.name,
      createdAt: report.createdAt.toISOString(),
      createdByUserId: report.createdByUserId,
      timeScale: report.timeScale,
      chartType: report.chartType,
      periodType: report.periodType,
      customStart: report.customStart?.toISOString(),
      customEnd: report.customEnd?.toISOString(),
    };

    return dto;
  }

  @UseGuards(IsReportAdminGuard)
  @Delete(':reportId')
  async deleteLinkByShortKey(@Param('reportId') reportId: string) {
    return await this.reportService.deleteReport({ id: reportId });
  }

  @Get(':reportId/stats')
  @UseGuards(HasReportViewPermissionGuard)
  async getStatsForReport(
    @Req() req: any,
    @Param('reportId') reportId: string,
    @Query('timezoneOffsetInMinutes', ParseIntPipe)
    timezoneOffsetInMinutes: number, // positive in MSK TZ
    @Query('timeScale') timeScale?: 'hour' | 'day' | 'month',
    @Query('from') from?: string,
    @Query('to') to?: string
  ): Promise<FullReportDto> {
    //console.log(timezoneOffsetInMinutes);
    const user: RequestUserPayloadDto = req.user;

    const userId = user.sub;
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        shortLinks: { include: { shortLink: true } },
        permissions: true,
      },
    });

    if (!report) {
      throw new NotFoundException(`Report with id '${reportId}' not found`);
    }

    // Определяем from/to исходя из параметров запроса или из настроек отчёта
    let parsedFrom: Date | undefined;
    let parsedTo: Date | undefined;

    if (from && to) {
      parsedFrom = new Date(from);
      parsedTo = new Date(to);
    } else {
      // Определяем по periodType из отчёта
      const now = new Date();
      console.log('now', now.toISOString());
      const clientNow = new Date(
        now.getTime() - timezoneOffsetInMinutes * 60 * 1000
      );
      console.log('clientNow', clientNow.toISOString());

      switch (report.periodType) {
        case 'last24h':
          parsedFrom = new Date(clientNow.getTime() - 24 * 3600 * 1000);
          parsedTo = clientNow;
          break;
        case 'last7d':
          parsedFrom = new Date(clientNow.getTime() - 7 * 24 * 3600 * 1000);
          parsedTo = clientNow;
          break;
        case 'last30d':
          parsedFrom = new Date(clientNow.getTime() - 30 * 24 * 3600 * 1000);
          parsedTo = clientNow;
          break;
        case 'last365d':
          parsedFrom = new Date(clientNow.getTime() - 365 * 24 * 3600 * 1000);
          parsedTo = clientNow;
          break;
        case 'allTime':
          parsedFrom = undefined; // будет вычисляться динамически
          parsedTo = clientNow;
          break;
        case 'custom':
          parsedFrom = report.customStart ?? undefined;
          parsedTo = report.customEnd ?? clientNow;
          break;
        default:
          parsedFrom = undefined;
          parsedTo = clientNow;
      }
    }

    const parsedTimeScale = timeScale ?? report.timeScale;

    const timeScaleQuery = {
      hour: Prisma.sql`'hour'`,
      day: Prisma.sql`'day'`,
      month: Prisma.sql`'month'`,
    }[parsedTimeScale];

    const interval = {
      hour: Prisma.sql`INTERVAL '1 hour'`,
      day: Prisma.sql`INTERVAL '1 day'`,
      month: Prisma.sql`INTERVAL '1 month'`,
    }[parsedTimeScale];

    const format = {
      hour: Prisma.sql`'DD-MM-YYYY HH24:MI:SS'`,
      day: Prisma.sql`'DD-MM-YYYY'`,
      month: Prisma.sql`'MM-YYYY'`,
    }[parsedTimeScale];

    const labelFormat = {
      hour: 'dd-MM-yyyy HH:mm:ss',
      day: 'dd-MM-yyyy',
      month: 'MM-yyyy',
    }[parsedTimeScale];

    const parseLabel = (label: string): Date => {
      console.log(label);
      const parsed = parse(label, labelFormat, new Date());
      if (!isValid(parsed)) {
        throw new Error(`Invalid label format: ${label}`);
      }
      return parsed;
    };

    const isRelative = report.periodType === 'custom' && !!parsedFrom;

    const linksStatsRaw = await Promise.all(
      report.shortLinks.map(async ({ shortLink }) => {
        const minDateSql = parsedFrom
          ? Prisma.sql`${parsedFrom}`
          : Prisma.sql`(SELECT MIN(DATE_TRUNC(${timeScaleQuery}, "clickedAt")) FROM "LinkStat" WHERE "shortLinkId" = ${shortLink.id})`;

        const maxDateSql = parsedTo
          ? Prisma.sql`${parsedTo}`
          : Prisma.sql`NOW()`;

        const rawStats: Array<{ period: string; clicks: number }> = await this
          .prisma.$queryRaw`
        WITH time_series AS (
          SELECT generate_series(${minDateSql}, ${maxDateSql}, ${interval}) AS period
        )
        SELECT
          t.period AT TIME ZONE 'UTC' AS period,
          COALESCE(COUNT(l."id")::int, 0) AS clicks
        FROM time_series t
        LEFT JOIN "LinkStat" l
          ON DATE_TRUNC(${timeScaleQuery}, l."clickedAt") = DATE_TRUNC(${timeScaleQuery}, t.period)
          AND l."shortLinkId" = ${shortLink.id}
          ${
            parsedFrom
              ? Prisma.sql`AND l."clickedAt" >= ${parsedFrom}`
              : Prisma.empty
          }
          ${
            parsedTo
              ? Prisma.sql`AND l."clickedAt" <= ${parsedTo}`
              : Prisma.empty
          }
        GROUP BY t.period
        ORDER BY t.period;
      `;

        const [total, byDevice, byBrowser, byReferrer] = await Promise.all([
          this.linkStatService.getTotalClicks({
            shortKey: shortLink.shortKey,
            from: parsedFrom,
            to: parsedTo,
          }),
          this.linkStatService.getClicksByDeviceType({
            shortKey: shortLink.shortKey,
            from: parsedFrom,
            to: parsedTo,
          }),
          this.linkStatService.getClicksByBrowser({
            shortKey: shortLink.shortKey,
            from: parsedFrom,
            to: parsedTo,
          }),
          this.linkStatService.getClicksByReferrer({
            shortKey: shortLink.shortKey,
            from: parsedFrom,
            to: parsedTo,
          }),
        ]);

        return {
          shortLinkId: shortLink.id,
          shortKey: shortLink.shortKey,
          description: shortLink.description,
          rawStats,
          total,
          byDevice,
          byBrowser,
          byReferrer,
        };
      })
    );

    const fullLabelSet = new Set<string>();
    linksStatsRaw.forEach((linkStat) => {
      linkStat.rawStats.forEach((s) => {
        const shifted = this.shiftLabelTime(
          s.period,
          labelFormat,
          timezoneOffsetInMinutes,
          isRelative
        );
        fullLabelSet.add(shifted);
      });
    });

    //console.log('Full label set:', inspect(fullLabelSet, false, Infinity, true));

    const allLabels = Array.from(fullLabelSet)
      .map((label) => ({ label, date: parseLabel(label) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(({ label }) => label);

    const linksStats = linksStatsRaw.map((linkStat) => {
      const statMap = new Map(
        linkStat.rawStats.map((s) => [
          this.shiftLabelTime(
            s.period,
            labelFormat,
            timezoneOffsetInMinutes,
            isRelative
          ),
          s.clicks,
        ])
      );
      const values = allLabels.map((label) => statMap.get(label) ?? 0);

      return {
        shortLinkId: linkStat.shortLinkId,
        shortKey: linkStat.shortKey,
        description: linkStat.description,
        labels: allLabels,
        values,
        total: linkStat.total,
        byDevice: linkStat.byDevice,
        byBrowser: linkStat.byBrowser,
        byReferrer: linkStat.byReferrer,
      };
    });

    const aggregate = this.reportService.mergeStats(linksStats);

    const permission = report.permissions.find((p) => p.userId === userId);

    if (!permission) {
      throw new ForbiddenException('У вас нет доступа к этому отчету');
    }

    return {
      ...report,
      role: permission.role,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      customStart: report.customStart?.toISOString(),
      customEnd: report.customEnd?.toISOString(),
      aggregate,
      linksStats,
    };
  }

  @Get(':reportId/export')
  @UseGuards(HasReportViewPermissionGuard)
  async exportReportDetailed(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @Param('reportId') reportId: string,
    @Query('timezoneOffsetInMinutes', ParseIntPipe)
    timezoneOffsetInMinutes: number,
    @Query('format') format: 'csv' | 'xlsx' = 'csv',
    @Query('timeScale') timeScale?: 'hour' | 'day' | 'month',
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { shortLinks: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const shortLinkIds = report.shortLinks.map((sl) => sl.shortLinkId);

    const links = await this.prisma.shortLink.findMany({
      where: { id: { in: shortLinkIds } },
      include: {
        user: { select: { login: true } },
      },
    });

    const stats = await this.getStatsForReport(
      req,
      reportId,
      timezoneOffsetInMinutes,
      timeScale,
      from,
      to
    );
    const { aggregate, linksStats } = stats;

    const allLabels = linksStats[0].labels;

    const finalHeaders = [
      { id: 'shortLink', title: 'shortLink' },
      { id: 'description', title: 'description' },
      { id: 'longLink', title: 'longLink' },
      { id: 'createdAt', title: 'createdAt' },
      { id: 'updatedAt', title: 'updatedAt' },
      { id: 'createdByUserLogin', title: 'createdByUserLogin' },
    ];

    const linkRows = links.map((link) => ({
      shortLink: longUrlFromShortKey(link.shortKey),
      description: link.description,
      longLink: link.longLink,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      createdByUserLogin: link.user.login,
    }));

    const aggregateRows = [
      { metric: 'Total Clicks', value: aggregate.total },
      ...aggregate.byDevice.map((d) => ({
        metric: `Device: ${d.deviceType}`,
        value: d._count._all,
      })),
      ...aggregate.byBrowser.map((b) => ({
        metric: `Browser: ${b.browser}`,
        value: b._count._all,
      })),
      ...aggregate.byReferrer.map((r) => ({
        metric: `Referrer: ${r.referrer}`,
        value: r._count._all,
      })),
    ];

    const linkStatRows = linksStats.map((stat) => {
      const row = [longUrlFromShortKey(stat.shortKey), ...stat.values];
      const additional = [
        ...stat.byDevice.map(
          (d) => `Device: ${d.deviceType} = ${d._count._all}`
        ),
        ...stat.byBrowser.map(
          (b) => `Browser: ${b.browser} = ${b._count._all}`
        ),
        ...stat.byReferrer.map(
          (r) => `Referrer: ${r.referrer} = ${r._count._all}`
        ),
      ];
      return [row, additional];
    });

    if (format === 'csv') {
      const csvStringifier = createObjectCsvStringifier({
        header: finalHeaders,
      });

      const csvContent = [
        csvStringifier.getHeaderString(),
        csvStringifier.stringifyRecords(linkRows),
        '',
        'Aggregate Stats:',
        'Metric,Value',
        ...aggregateRows.map((r) => `${r.metric},${r.value}`),
        '',
        ['Dates', ...allLabels].join(','),
        ...linkStatRows.map(([mainRow]) => mainRow.join(',')),
        '',
        'Per-link additional stats:',
        ...linkStatRows.flatMap(([mainRow, stats]) => [
          `Stats for ${mainRow[0]}:`,
          ...stats.map((s) => `,${s}`),
          '',
        ]),
      ].join('\n');

      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(
          `report-${report.name}.csv`
        )}`,
      });
      res.send(csvContent);
    } else if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Report');

      // 1. Таблица ссылок
      sheet.addRow(finalHeaders.map((h) => h.title));
      for (const row of linkRows) {
        sheet.addRow(finalHeaders.map((h) => (row as any)[h.id]));
      }

      sheet.addRow([]);
      sheet.addRow(['Aggregate Stats:']);
      sheet.addRow(['Metric', 'Value']);
      for (const r of aggregateRows) {
        sheet.addRow([r.metric, r.value]);
      }

      sheet.addRow([]);
      sheet.addRow(['Dates', ...allLabels]);

      // 2. Только переходы по датам
      for (const [mainRow] of linkStatRows) {
        sheet.addRow(mainRow);
      }

      // 3. Дополнительные метрики по каждой ссылке
      sheet.addRow([]);
      sheet.addRow(['Per-link additional stats:']);

      for (const [mainRow, stats] of linkStatRows) {
        sheet.addRow([`Stats for ${mainRow[0]}`]);
        for (const stat of stats) {
          sheet.addRow([null, stat]);
        }
        sheet.addRow([]);
      }

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(
          `report-${report.name}.xlsx`
        )}`,
      });
      await workbook.xlsx.write(res);
      res.end();
    }
  }

  shiftLabelTime(
    isoDate: string,
    labelFormat: string,
    timezoneOffsetInMinutes: number,
    isRelative: boolean
  ): string {
    const parsed = new Date(isoDate);
    if (!isValid(parsed)) {
      throw new Error(`Invalid ISO date: ${isoDate}`);
    }

    const shifted = isRelative
      ? addMinutes(parsed, -timezoneOffsetInMinutes)
      : parsed;
    return format(shifted, labelFormat);
  }
}
