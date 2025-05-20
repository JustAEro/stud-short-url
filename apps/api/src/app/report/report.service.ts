import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ByBrowserDto,
  ByDeviceDto,
  ByReferrerDto,
  LinkDetailedStatsDto,
  LinkStatReportDto,
} from '@stud-short-url/common';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(userId: string, name: string, shortLinkIds: string[]) {
    const validLinks = await this.prisma.shortLink.findMany({
      where: { id: { in: shortLinkIds } },
      select: { id: true },
    });

    if (validLinks.length !== shortLinkIds.length) {
      throw new BadRequestException('Некоторые короткие ссылки не найдены');
    }

    // Всё в одной транзакции
    const [report] = await this.prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          name,
          createdByUserId: userId,
        },
      });

      await tx.reportShortLink.createMany({
        data: shortLinkIds.map((id) => ({
          reportId: report.id,
          shortLinkId: id,
        })),
        skipDuplicates: true,
      });

      await tx.reportPermission.create({
        data: {
          reportId: report.id,
          userId,
          role: 'admin',
        },
      });

      return [report];
    });

    return this.prisma.report.findUnique({
      where: { id: report.id },
      include: {
        shortLinks: {
          include: { shortLink: true },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.report.findMany({
      where: { permissions: { some: { userId } } },
      include: { shortLinks: true },
    });
  }

  mergeStats(linksResults: LinkStatReportDto[]): LinkDetailedStatsDto {
    const total = linksResults.reduce((sum, l) => sum + l.total, 0);

    const byDeviceMap: Record<string, number> = {};
    const byBrowserMap: Record<string, number> = {};
    const byReferrerMap: Record<string, number> = {};

    for (const link of linksResults) {
      for (const d of link.byDevice) {
        byDeviceMap[d.deviceType] =
          (byDeviceMap[d.deviceType] || 0) + d._count._all;
      }
      for (const b of link.byBrowser) {
        byBrowserMap[b.browser] =
          (byBrowserMap[b.browser] || 0) + b._count._all;
      }
      for (const r of link.byReferrer) {
        const key = r.referrer ?? 'unknown';
        byReferrerMap[key] = (byReferrerMap[key] || 0) + r._count._all;
      }
    }

    const byDevice: ByDeviceDto = Object.entries(byDeviceMap).map(
      ([deviceType, count]) => ({
        deviceType,
        _count: { _all: count },
      })
    );

    const byBrowser: ByBrowserDto = Object.entries(byBrowserMap).map(
      ([browser, count]) => ({
        browser,
        _count: { _all: count },
      })
    );

    const byReferrer: ByReferrerDto = Object.entries(byReferrerMap).map(
      ([referrer, count]) => ({
        referrer: referrer === 'unknown' ? null : referrer,
        _count: { _all: count },
      })
    );

    return {
      total,
      byDevice,
      byBrowser,
      byReferrer,
    };
  }
}
