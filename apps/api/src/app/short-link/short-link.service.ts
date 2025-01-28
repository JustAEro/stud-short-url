import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma, ShortLink } from "@prisma/client";

@Injectable()
export class ShortLinkService {
    constructor(private readonly prismaService: PrismaService) {}

    async getLink(
        shortLinkWhereUniqueInput: Prisma.ShortLinkWhereUniqueInput
    ): Promise<ShortLink | null> {
        const shortLink = await this.prismaService.shortLink.findUnique({
            where: shortLinkWhereUniqueInput
        });

        return shortLink;
    }

    async getAllLinks(): Promise<ShortLink[]> {
        const links = await this.prismaService.shortLink.findMany();

        return links;
    }

    async createLink(data: Prisma.ShortLinkCreateInput): Promise<ShortLink> {
        const createLink = await this.prismaService.shortLink.create({
            data
        });

        return createLink;
    }

    async updateLink(params: {
        where: Prisma.ShortLinkWhereUniqueInput
        data: Prisma.ShortLinkUpdateInput
    }): Promise<ShortLink> {
        const updateLink = await this.prismaService.shortLink.update({
            where: params.where,
            data: params.data,
        });

        return updateLink;
    }

    async deleteLink(where: Prisma.ShortLinkWhereUniqueInput): Promise<ShortLink> {
        const deleteLink = await this.prismaService.shortLink.delete({
            where
        });

        return deleteLink;
    }

    generateUrlSafeString(): string {
        const urlSafeChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
        const array = new Uint8Array(8); // Массив для 8 случайных байт
        crypto.getRandomValues(array); // Генерация случайных чисел
      
        // Преобразование случайных чисел в символы URL-safe
        return Array.from(array, (byte) => urlSafeChars[byte % urlSafeChars.length]).join('');
    }
}