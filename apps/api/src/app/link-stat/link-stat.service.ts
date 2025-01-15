import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { RegisterClickParams } from "./types";

@Injectable()
export class LinkStatService {
    constructor(private readonly prismaService: PrismaService) {}

    async registerClick({shortKey, ...statData}: RegisterClickParams) {
        const shortLink = await this.prismaService.shortLink.findUnique({
            where: {shortKey}
        });

        if (!shortLink) {
            throw new NotFoundException('Short link not found');
        }

        await this.prismaService.linkStat.create({
            data: {
                shortLinkId: shortLink.id,
                ...statData,
            }
        });
    }

    async getTotalClicks(shortKey: string): Promise<number> {
        const totalClicks = await this.prismaService.linkStat.count({
            where: {shortLink: {shortKey}}
        });

        return totalClicks;
    }

    async getClicksByDeviceType(shortKey: string) {
        const clicksByDevice = await this.prismaService.linkStat.groupBy({
            by: ['deviceType'],
            where: {shortLink: {shortKey}},
            _count: {_all: true}
        });

        return clicksByDevice;
    }

    async getClicksByBrowser(shortKey: string) {
        const clicksByBrowser = await this.prismaService.linkStat.groupBy({
            by: ['browser'],
            where: {shortLink: {shortKey}},
            _count: {_all: true}
        });

        return clicksByBrowser;
    }

    async getClicksByReferrer(shortKey: string) {
        const clicksByReferrer = await this.prismaService.linkStat.groupBy({
            by: ['referrer'],
            where: {shortLink: {shortKey}},
            _count: {_all: true}
        });

        return clicksByReferrer;
    }
}