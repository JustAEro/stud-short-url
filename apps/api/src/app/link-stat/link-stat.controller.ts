import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('link-stat')
export class LinkStatController {
  constructor(private prisma: PrismaService) {}

  @Get(':shortKey/stats')
  async getStats(
    @Param('shortKey') shortKey: string,
    @Query('timeScale') timeScale: 'hour' | 'day' | 'month'
  ) {

    console.log(shortKey);

    const shortLink = await this.prisma.shortLink.findUnique({where: {shortKey}});

    if (!shortLink) {
        throw new NotFoundException(`Short link with key '${shortKey}' not found`);
    }

    console.log(shortLink);

    const groupBy = {
      hour: `DATE_TRUNC('hour', clickedAt)`,
      day: `DATE_TRUNC('day', clickedAt)`,
      month: `DATE_TRUNC('month', clickedAt)`,
    }[timeScale];

    const stats: Array<{ period: string; clicks: number }> = await this.prisma.$queryRaw`
      SELECT TO_CHAR(${groupBy}::timestamp, 'YYYY-MM-DD HH24:MI:SS') AS period, COUNT(*)::int AS clicks
      FROM "LinkStat"
      WHERE "shortLinkId" = ${shortLink.id}
      GROUP BY period
      ORDER BY period`;

    console.log(stats);

    return {
      labels: stats.map((stat) => stat.period),
      values: stats.map((stat) => stat.clicks),
    };
  }
}
