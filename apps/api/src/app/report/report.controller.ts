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
} from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { LinkStatService } from '../link-stat/link-stat.service';
import { Prisma } from '@prisma/client';
import { FullReportDto, ReportDto, RequestUserPayloadDto } from '@stud-short-url/common';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportController {
  constructor(
    private readonly reportsService: ReportService,
    private readonly prisma: PrismaService,
    private readonly linkStatService: LinkStatService
  ) {}

  @Post()
  async create(
    @Req() req: any,
    @Body() body: { name: string; shortLinkIds: string[] }
  ): Promise<ReportDto> {
    const user: RequestUserPayloadDto = req.user;

    const userId = user.sub;

    const report = await this.reportsService.createReport(
      userId,
      body.name,
      body.shortLinkIds
    );

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const dto: ReportDto = {
      ...report,
      createdAt: report.createdAt.toISOString(),
    }

    return dto;
  }

  @Get()
  async findAll(@Req() req: any) {
    const user: RequestUserPayloadDto = req.user;

    const userId = user.sub;

    return this.reportsService.findAll(userId);
  }

  @Get(':id/stats')
  // TODO: add view permission check
  async getStatsForReport(
    @Param('id') reportId: string,
    @Query('timeScale') timeScale: 'hour' | 'day' | 'month',
    @Query('from') from?: string,
    @Query('to') to?: string
  ): Promise<FullReportDto> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        shortLinks: {
          include: {
            shortLink: true,
          },
        },
        permissions: true,
      },
    });

    if (!report) {
      throw new NotFoundException(`Report with id '${reportId}' not found`);
    }

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

    const parsedFrom = from ? new Date(from) : undefined;
    const parsedTo = to ? new Date(to) : undefined;

    const linksStats = await Promise.all(
      report.shortLinks.map(async (link) => {
        const shortLink = link.shortLink;

        const minDateSql = parsedFrom
          ? Prisma.sql`${parsedFrom}`
          : Prisma.sql`(SELECT MIN(DATE_TRUNC(${timeScaleQuery}, "clickedAt")) FROM "LinkStat" WHERE "shortLinkId" = ${shortLink.id})`;

        const maxDateSql = parsedTo
          ? Prisma.sql`${parsedTo}`
          : Prisma.sql`NOW()`;

        const stats: Array<{ period: string; clicks: number }> = await this
          .prisma.$queryRaw`
        WITH time_series AS (
          SELECT generate_series(
            ${minDateSql},
            ${maxDateSql},
            ${interval}
          ) AS period
        )
        SELECT
          TO_CHAR(t.period, ${format}) AS period,
          COALESCE(COUNT(l."id")::int, 0) AS clicks
        FROM time_series t
        LEFT JOIN "LinkStat" l
          ON DATE_TRUNC(${timeScaleQuery}, l."clickedAt") = t.period
          AND l."shortLinkId" = ${shortLink.id}
          ${parsedFrom ? Prisma.sql`AND l."clickedAt" >= ${parsedFrom}` : Prisma.empty}
          ${parsedTo ? Prisma.sql`AND l."clickedAt" <= ${parsedTo}` : Prisma.empty}
        GROUP BY t.period
        ORDER BY t.period;
      `;

      const [total, byDevice, byBrowser, byReferrer] = await Promise.all([
          this.linkStatService.getTotalClicks({shortKey: shortLink.shortKey, from: parsedFrom, to: parsedTo}),
          this.linkStatService.getClicksByDeviceType({shortKey: shortLink.shortKey, from: parsedFrom, to: parsedTo}),
          this.linkStatService.getClicksByBrowser({shortKey: shortLink.shortKey, from: parsedFrom, to: parsedTo}),
          this.linkStatService.getClicksByReferrer({shortKey: shortLink.shortKey, from: parsedFrom, to: parsedTo}),
        ]);

        const labels = stats.map((s) => s.period);
        const values = stats.map((s) => s.clicks);

        return {
          shortLinkId: shortLink.id,
          shortKey: shortLink.shortKey,
          labels,
          values,
          total,
          byDevice,
          byBrowser,
          byReferrer,
        };
      })
    );

    // Merge all link stats into one aggregate report
    const aggregate = this.reportsService.mergeStats(linksStats);

    return {
      aggregate,
      linksStats,
    };
  }
}
