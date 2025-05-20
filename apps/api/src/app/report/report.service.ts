import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ByBrowserDto,
  ByDeviceDto,
  ByReferrerDto,
  LinkDetailedStatsDto,
  LinkStatReportDto,
  ReportDto,
  ReportWithPermissionsDto,
} from '@stud-short-url/common';
import { ReportApi } from './types';
import { Prisma, Report } from '@prisma/client';

@Injectable()
export class ReportService {
  constructor(private readonly prismaService: PrismaService) {}

  async createReport(
    userId: string,
    name: string,
    shortLinkIds: string[]
  ): Promise<ReportApi | null> {
    const validLinks = await this.prismaService.shortLink.findMany({
      where: { id: { in: shortLinkIds } },
      select: { id: true },
    });

    if (validLinks.length !== shortLinkIds.length) {
      throw new BadRequestException('Некоторые короткие ссылки не найдены');
    }

    // Всё в одной транзакции
    const [report] = await this.prismaService.$transaction(async (tx) => {
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

    return this.prismaService.report.findUnique({
      where: { id: report.id },
      include: {
        shortLinks: {
          include: { shortLink: true },
        },
      },
    });
  }

  async findAll(userId: string): Promise<ReportApi[]> {
    return this.prismaService.report.findMany({
      where: { permissions: { some: { userId } } },
      include: { shortLinks: { include: { shortLink: true } } },
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

  reportApiToDto(report: ReportApi): ReportDto {
    return {
      id: report.id,
      name: report.name,
      createdByUserId: report.createdByUserId,
      shortLinks: report.shortLinks,
      createdAt: report.createdAt.toISOString(),
    };
  }

  async getReportById({
    reportId,
    userId,
  }: {
    reportId: string;
    userId: string;
  }): Promise<ReportWithPermissionsDto> {
    const report = await this.prismaService.report.findUnique({
      where: { id: reportId },
      include: { permissions: true, creatorUser: true },
    });

    if (!report) {
      throw new NotFoundException('Отчет не найден');
    }

    const permission = report.permissions.find((p) => p.userId === userId);

    if (!permission) {
      throw new ForbiddenException('У вас нет доступа к этому отчету');
    }

    return {
      ...report,
      createdAt: report.createdAt.toISOString(),
      role: permission.role,
    };
  }

  async updateReport(params: {
    where: Prisma.ReportWhereUniqueInput;
    data: Prisma.ReportUpdateInput;
  }): Promise<Report> {
    const updateReport = await this.prismaService.report.update({
      where: params.where,
      data: params.data,
    });

    return updateReport;
  }

  async deleteReport(where: Prisma.ReportWhereUniqueInput): Promise<Report> {
    const deleteReport = await this.prismaService.report.delete({
      where,
    });

    return deleteReport;
  }
}
