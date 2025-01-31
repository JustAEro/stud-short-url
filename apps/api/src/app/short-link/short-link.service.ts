import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ShortLink } from '@prisma/client';

@Injectable()
export class ShortLinkService {
  constructor(private readonly prismaService: PrismaService) {}

  async getLink(
    shortLinkWhereUniqueInput: Prisma.ShortLinkWhereUniqueInput
  ): Promise<ShortLink | null> {
    const shortLink = await this.prismaService.shortLink.findUnique({
      where: shortLinkWhereUniqueInput,
    });

    return shortLink;
  }

  async getShortLinkByKey({
    shortKey,
    userId,
  }: {
    shortKey: string;
    userId: string;
  }) {
    const shortLink = await this.prismaService.shortLink.findUnique({
      where: { shortKey },
      include: { permissions: true, user: true },
    });

    if (!shortLink) {
      throw new NotFoundException('Ссылка не найдена');
    }

    const isOwner = shortLink.createdByUserId === userId;
    const canEdit =
      isOwner || shortLink.permissions.some((p) => p.userId === userId);

    return { ...shortLink, isOwner, canEdit };
  }

  async getAllLinks(): Promise<ShortLink[]> {
    const links = await this.prismaService.shortLink.findMany();

    return links;
  }

  async findAllSorted({
    sortBy,
    direction,
    search,
    page,
    limit,
    userId,
  }: {
    sortBy: 'updatedAt' | 'createdAt' | 'description' | undefined;
    direction: 'asc' | 'desc' | undefined;
    search: string;
    page: number;
    limit: number;
    userId: string;
  }) {
    const orderBy = this.getOrderBy({ sortBy, direction });

    const where = {
      OR: [
        { createdByUserId: userId }, // Ссылки, созданные пользователем
        { permissions: { some: { userId } } }, // Ссылки, на которые есть доступ
      ],
      AND: search
        ? {
            OR: [
              {
                description: { contains: search, mode: 'insensitive' as const },
              },
              { shortKey: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {},
    };
    const totalCount = await this.prismaService.shortLink.count({ where });

    const sortedLinks = await this.prismaService.shortLink.findMany({
      orderBy,
      where,
      skip: (page - 1) * limit,
      take: Number(limit), // to pass prisma validation
    });

    if (sortBy === 'description') {
      sortedLinks.sort((a, b) => {
        const aDescription = (a.description || a.shortKey).toLocaleLowerCase();
        const bDescription = (b.description || b.shortKey).toLocaleLowerCase();

        if (direction === 'asc') {
          return aDescription.localeCompare(bDescription);
        }

        if (direction === 'desc') {
          return bDescription.localeCompare(aDescription);
        }

        return aDescription.localeCompare(bDescription);
      });
    }

    return {
      data: sortedLinks,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
    };
  }

  private getOrderBy({
    sortBy,
    direction,
  }: {
    sortBy: 'updatedAt' | 'createdAt' | 'description' | undefined;
    direction: 'asc' | 'desc' | undefined;
  }) {
    switch (sortBy) {
      case 'createdAt':
        return { createdAt: direction ?? ('desc' as const) };
      case 'updatedAt':
        return { updatedAt: direction ?? ('desc' as const) };
      case 'description':
        return [
          { description: direction ?? ('asc' as const) },
          { shortKey: direction ?? ('asc' as const) },
        ];
      default:
        return { updatedAt: direction ?? ('desc' as const) };
    }
  }

  async createLink(data: Prisma.ShortLinkCreateInput): Promise<ShortLink> {
    const createLink = await this.prismaService.shortLink.create({
      data,
    });

    return createLink;
  }

  async updateLink(params: {
    where: Prisma.ShortLinkWhereUniqueInput;
    data: Prisma.ShortLinkUpdateInput;
  }): Promise<ShortLink> {
    const updateLink = await this.prismaService.shortLink.update({
      where: params.where,
      data: params.data,
    });

    return updateLink;
  }

  async deleteLink(
    where: Prisma.ShortLinkWhereUniqueInput
  ): Promise<ShortLink> {
    const deleteLink = await this.prismaService.shortLink.delete({
      where,
    });

    return deleteLink;
  }

  generateUrlSafeString(): string {
    const urlSafeChars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    const array = new Uint8Array(8); // Массив для 8 случайных байт
    crypto.getRandomValues(array); // Генерация случайных чисел

    // Преобразование случайных чисел в символы URL-safe
    return Array.from(
      array,
      (byte) => urlSafeChars[byte % urlSafeChars.length]
    ).join('');
  }
}
