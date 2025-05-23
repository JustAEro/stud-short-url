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
  ReportWithPermissionsDto,
  RequestUserPayloadDto,
  UpdateReportBodyDto,
} from '@stud-short-url/common';
import { parse, isValid } from 'date-fns';
import { HasReportViewPermissionGuard } from '../report-permission/has-report-view-permission.guard';
import { HasReportEditPermissionGuard } from '../report-permission/has-report-edit-permission.guard';
import { IsReportAdminGuard } from '../report-permission/is-report-admin.guard';
import { Response } from 'express';
import { createObjectCsvStringifier } from 'csv-writer';
import * as ExcelJS from 'exceljs';
import { StreamableFile } from '@nestjs/common';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly prisma: PrismaService,
    private readonly linkStatService: LinkStatService
  ) {}

  @Get()
  async findAll(@Req() req: any): Promise<ReportDto[]> {
    const user: RequestUserPayloadDto = req.user;

    const userId = user.sub;

    const reports = await this.reportService.findAll(userId);

    const dtos = reports.map((report) =>
      this.reportService.reportApiToDto(report)
    );

    return dtos;
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
      body.shortLinkIds
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
      ...report,
      createdAt: report.createdAt.toISOString(),
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
    @Param('reportId') reportId: string,
    @Query('timeScale') timeScale: 'hour' | 'day' | 'month',
    @Query('from') from?: string,
    @Query('to') to?: string
  ): Promise<FullReportDto> {
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

    const parsedFrom = from ? new Date(from) : undefined;
    const parsedTo = to ? new Date(to) : undefined;

    const timeScaleQuery = {
      hour: Prisma.sql`'hour'`,
      day: Prisma.sql`'day'`,
      month: Prisma.sql`'month'`,
    }[timeScale];

    const interval = {
      hour: Prisma.sql`INTERVAL '1 hour'`,
      day: Prisma.sql`INTERVAL '1 day'`,
      month: Prisma.sql`INTERVAL '1 month'`,
    }[timeScale];

    const format = {
      hour: Prisma.sql`'DD-MM-YYYY HH24:MI:SS'`,
      day: Prisma.sql`'DD-MM-YYYY'`,
      month: Prisma.sql`'MM-YYYY'`,
    }[timeScale];

    const labelFormat = {
      hour: 'dd-MM-yyyy HH:mm:ss',
      day: 'dd-MM-yyyy',
      month: 'MM-yyyy',
    }[timeScale];

    const parseLabel = (label: string): Date => {
      const parsed = parse(label, labelFormat, new Date());
      if (!isValid(parsed)) {
        throw new Error(`Invalid label format: ${label}`);
      }
      return parsed;
    };

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
          TO_CHAR(t.period, ${format}) AS period,
          COALESCE(COUNT(l."id")::int, 0) AS clicks
        FROM time_series t
        LEFT JOIN "LinkStat" l
          ON DATE_TRUNC(${timeScaleQuery}, l."clickedAt") = t.period
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
      linkStat.rawStats.forEach((s) => fullLabelSet.add(s.period));
    });

    const allLabels = Array.from(fullLabelSet)
      .map((label) => ({ label, date: parseLabel(label) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(({ label }) => label);

    const linksStats = linksStatsRaw.map((linkStat) => {
      const statMap = new Map(
        linkStat.rawStats.map((s) => [s.period, s.clicks])
      );
      const values = allLabels.map((label) => statMap.get(label) ?? 0);

      return {
        shortLinkId: linkStat.shortLinkId,
        shortKey: linkStat.shortKey,
        labels: allLabels,
        values,
        total: linkStat.total,
        byDevice: linkStat.byDevice,
        byBrowser: linkStat.byBrowser,
        byReferrer: linkStat.byReferrer,
      };
    });

    const aggregate = this.reportService.mergeStats(linksStats);

    return {
      aggregate,
      linksStats,
    };
  }

  @Get(':reportId/export')
  @UseGuards(HasReportViewPermissionGuard)
  async exportReportDetailed(
    @Param('reportId') reportId: string,
    @Query('format') format: 'csv' | 'excel' = 'csv',
    @Query('timeScale') timeScale: 'hour' | 'day' | 'month' = 'hour',
    @Res({ passthrough: true }) res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    // Получаем статистику, аналогично твоему методу getStatsForReport
    const stats: FullReportDto = await this.getStatsForReport(
      reportId,
      timeScale,
      from,
      to
    );

    // Подготавливаем строки для экспорта
    const rows: Array<{
      shortLink: string;
      period: string;
      clicks: number;
      deviceType: string;
      browser: string;
      referrer: string;
    }> = [];

    for (const linkStat of stats.linksStats) {
      // Добавляем по периодам основную статистику
      for (let i = 0; i < linkStat.labels.length; i++) {
        rows.push({
          shortLink: linkStat.shortKey,
          period: linkStat.labels[i],
          clicks: linkStat.values[i],
          deviceType: '',
          browser: '',
          referrer: '',
        });
      }

      // Добавляем агрегаты по устройствам (без разбивки по периодам)
      for (const d of linkStat.byDevice) {
        rows.push({
          shortLink: linkStat.shortKey,
          period: 'ALL',
          clicks: d._count._all,
          deviceType: d.deviceType,
          browser: '',
          referrer: '',
        });
      }

      // По браузерам
      for (const b of linkStat.byBrowser) {
        rows.push({
          shortLink: linkStat.shortKey,
          period: 'ALL',
          clicks: b._count._all,
          deviceType: '',
          browser: b.browser,
          referrer: '',
        });
      }

      // По реферерам
      for (const r of linkStat.byReferrer) {
        rows.push({
          shortLink: linkStat.shortKey,
          period: 'ALL',
          clicks: r._count._all,
          deviceType: '',
          browser: '',
          referrer: r.referrer ?? 'null',
        });
      }
    }

    if (format === 'csv') {
      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'shortLink', title: 'Short Link' },
          { id: 'period', title: 'Period' },
          { id: 'clicks', title: 'Clicks' },
          { id: 'deviceType', title: 'Device Type' },
          { id: 'browser', title: 'Browser' },
          { id: 'referrer', title: 'Referrer' },
        ],
      });

      const csvHeader = csvStringifier.getHeaderString();
      const csvBody = csvStringifier.stringifyRecords(rows);
      const csvContent = csvHeader + csvBody;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=report-${reportId}.csv`
      );

      return csvContent;
    } else {
      // Excel export
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Report Detailed');

      sheet.columns = [
        { header: 'Short Link', key: 'shortLink', width: 20 },
        { header: 'Period', key: 'period', width: 20 },
        { header: 'Clicks', key: 'clicks', width: 10 },
        { header: 'Device Type', key: 'deviceType', width: 15 },
        { header: 'Browser', key: 'browser', width: 15 },
        { header: 'Referrer', key: 'referrer', width: 30 },
      ];

      rows.forEach((row) => sheet.addRow(row));

      const buffer = await workbook.xlsx.writeBuffer();
      const uint8Array = new Uint8Array(buffer);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=report-${reportId}.xlsx`
      );

      return new StreamableFile(uint8Array);
    }
  }
}
