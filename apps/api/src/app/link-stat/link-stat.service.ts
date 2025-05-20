import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RegisterClickParams } from './types';

@Injectable()
export class LinkStatService {
  constructor(private readonly prismaService: PrismaService) {}

  async registerClick({ shortKey, ...statData }: RegisterClickParams) {
    const shortLink = await this.prismaService.shortLink.findUnique({
      where: { shortKey },
    });

    if (!shortLink) {
      throw new NotFoundException('Short link not found');
    }

    await this.prismaService.linkStat.create({
      data: {
        shortLinkId: shortLink.id,
        ...statData,
      },
    });
  }

  async getTotalClicks({
    shortKey,
    from,
    to,
  }: {
    shortKey: string;
    from?: Date;
    to?: Date;
  }): Promise<number> {
    const totalClicks = await this.prismaService.linkStat.count({
      where: {
        shortLink: { shortKey },
        clickedAt: {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        },
      },
    });

    return totalClicks;
  }

  async getClicksByDeviceType({
    shortKey,
    from,
    to,
  }: {
    shortKey: string;
    from?: Date;
    to?: Date;
  }) {
    const clicksByDevice = await this.prismaService.linkStat.groupBy({
      by: ['deviceType'],
      where: {
        shortLink: { shortKey },
        clickedAt: {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        },
      },
      _count: { _all: true },
    });

    return clicksByDevice;
  }

  async getClicksByBrowser({
    shortKey,
    from,
    to,
  }: {
    shortKey: string;
    from?: Date;
    to?: Date;
  }) {
    const clicksByBrowser = await this.prismaService.linkStat.groupBy({
      by: ['browser'],
      where: {
        shortLink: { shortKey },
        clickedAt: {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        },
      },
      _count: { _all: true },
    });

    return clicksByBrowser;
  }

  async getClicksByReferrer({
    shortKey,
    from,
    to,
  }: {
    shortKey: string;
    from?: Date;
    to?: Date;
  }) {
    const clicksByReferrer = await this.prismaService.linkStat.groupBy({
      by: ['referrer'],
      where: {
        shortLink: { shortKey },
        clickedAt: {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        },
      },
      _count: { _all: true },
    });

    return clicksByReferrer;
  }
}
