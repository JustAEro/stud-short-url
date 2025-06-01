import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LinkStatService } from './link-stat.service';
import {
  LinkDetailedStatsDto,
  LinkStatClicksDto,
} from '@stud-short-url/common';

@Controller('link-stat')
export class LinkStatController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly linkStatService: LinkStatService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(':shortKey/stats')
  async getStats(
    @Param('shortKey') shortKey: string,
    @Query('timeScale') timeScale: 'hour' | 'day' | 'month',
    @Query('timezoneOffsetInMinutes', ParseIntPipe)
    timezoneOffsetInMinutes: number // negative in MSK TZ (should be -180)
  ): Promise<LinkStatClicksDto> {
    const shortLink = await this.prisma.shortLink.findUnique({
      where: { shortKey },
    });

    if (!shortLink) {
      throw new NotFoundException(
        `Short link with key '${shortKey}' not found`
      );
    }

    // const now = new Date();

    // const clientNow = new Date(
    //   now.getTime() - timezoneOffsetInMinutes * 60 * 1000
    // );

    // const maxDateSql = Prisma.sql`${clientNow}`;

    // Определяем параметры для группировки
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

    // Запрос с генерацией временного ряда
    const stats: Array<{ period: string; clicks: number }> = await this.prisma
      .$queryRaw`
    WITH time_series AS (
      SELECT generate_series(
        (SELECT MIN(DATE_TRUNC(${timeScaleQuery}, "clickedAt")) FROM "LinkStat" WHERE "shortLinkId" = ${shortLink.id}),
        NOW(),
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
    GROUP BY t.period
    ORDER BY t.period;
  `;

    return {
      labels: stats.map((stat) => stat.period),
      values: stats.map((stat) => stat.clicks),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':shortKey/details')
  async getDetailedStats(
    @Param('shortKey') shortKey: string
  ): Promise<LinkDetailedStatsDto> {
    const [total, byDevice, byBrowser, byReferrer] = await Promise.all([
      this.linkStatService.getTotalClicks({ shortKey }),
      this.linkStatService.getClicksByDeviceType({ shortKey }),
      this.linkStatService.getClicksByBrowser({ shortKey }),
      this.linkStatService.getClicksByReferrer({ shortKey }),
    ]);

    return {
      total,
      byDevice,
      byBrowser,
      byReferrer,
    };
  }
}
