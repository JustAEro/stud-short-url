import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EditPermissionService {
  constructor(private prisma: PrismaService) {}

  // Добавить право редактирования
  async addPermission({
    shortLinkId,
    login,
    currentUserLogin,
  }: {
    shortLinkId: string;
    login: string;
    currentUserLogin: string;
  }) {
    if (login === currentUserLogin) {
      throw new ConflictException(
        'Создатель не может добавить себе право редактирования ссылки, оно у него есть по умолчанию'
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { login },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверяем, не существует ли уже права редактирования для данного пользователя и ссылки
    const existingPermission = await this.prisma.editPermission.findFirst({
      where: {
        userId: user.id,
        shortLinkId: shortLinkId,
      },
    });

    if (existingPermission) {
      throw new ConflictException(
        'Пользователь уже имеет право редактирования для этой ссылки'
      );
    }

    const permission = await this.prisma.editPermission.create({
      data: {
        userId: user.id,
        shortLinkId: shortLinkId,
      },
    });

    return permission;
  }

  // Удалить право редактирования
  async removePermission({
    shortLinkId,
    login,
  }: {
    shortLinkId: string;
    login: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { login },
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Проверяем, существует ли уже право редактирования
    const permission = await this.prisma.editPermission.findFirst({
      where: {
        userId: user.id,
        shortLinkId: shortLinkId,
      },
    });

    if (!permission) {
      throw new NotFoundException(
        'Права редактирования для этого пользователя не существует'
      );
    }

    const deletedPermission = await this.prisma.editPermission.deleteMany({
      where: {
        userId: user.id,
        shortLinkId: shortLinkId,
      },
    });

    return deletedPermission;
  }

  // Проверка, имеет ли пользователь права на редактирование
  async hasEditPermission({
    shortLinkId,
    userId,
  }: {
    shortLinkId: string;
    userId: string;
  }) {
    const permission = await this.prisma.editPermission.findFirst({
      where: {
        shortLinkId: shortLinkId,
        userId: userId,
      },
    });

    return !!permission;
  }

  async getPermissions(shortLinkId: string, userId: string) {
    // Проверяем, что запрашивающий — владелец ссылки
    const link = await this.prisma.shortLink.findUnique({
      where: { id: shortLinkId },
      include: { user: true },
    });

    if (!link) {
      throw new NotFoundException('Короткая ссылка не найдена');
    }

    if (link.createdByUserId !== userId) {
      throw new ForbiddenException('Нет прав для просмотра');
    }

    // Получаем список пользователей с правами
    const permissions = await this.prisma.editPermission.findMany({
      where: { shortLinkId },
      include: { user: true },
    });

    return permissions.map((perm) => ({
      id: perm.user.id,
      login: perm.user.login,
    }));
  }
}
