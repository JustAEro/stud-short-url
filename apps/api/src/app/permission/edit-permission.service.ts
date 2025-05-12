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

  // Назначить создателя ссылки админом сразу после создания
  async grantAdminToCreator(shortLinkId: string, creatorUserId: string) {
    const existing = await this.prisma.editPermission.findFirst({
      where: {
        shortLinkId,
        userId: creatorUserId,
      },
    });

    if (existing) {
      throw new ConflictException('Создателю уже назначены права');
    }

    return this.prisma.editPermission.create({
      data: {
        shortLinkId,
        userId: creatorUserId,
        role: 'admin',
      },
    });
  }

  // Добавить право редактирования
  async addPermission({
    shortLinkId,
    login,
    role,
    currentUserLogin,
  }: {
    shortLinkId: string;
    login: string;
    role: 'viewer' | 'editor' | 'admin';
    currentUserLogin: string;
  }) {
    const currentUser = await this.prisma.user.findUnique({
      where: { login: currentUserLogin },
    });
    if (!currentUser)
      throw new NotFoundException('Текущий пользователь не найден');

    const targetUser = await this.prisma.user.findUnique({ where: { login } });
    if (!targetUser) throw new NotFoundException('Пользователь не найден');

    if (currentUser.id === targetUser.id) {
      throw new ConflictException('Нельзя добавить права самому себе');
    }

    const link = await this.prisma.shortLink.findUnique({
      where: { id: shortLinkId },
    });

    if (!link) throw new NotFoundException('Ссылка не найдена');

    const currentPermission = await this.prisma.editPermission.findFirst({
      where: { shortLinkId, userId: currentUser.id },
    });

    if (currentPermission?.role !== 'admin') {
      throw new ForbiddenException(
        'Недостаточно прав для добавления разрешений'
      );
    }

    const existingPermission = await this.prisma.editPermission.findFirst({
      where: {
        userId: targetUser.id,
        shortLinkId,
      },
    });

    if (existingPermission) {
      throw new ConflictException('Пользователь уже имеет права');
    }

    return this.prisma.editPermission.create({
      data: {
        userId: targetUser.id,
        shortLinkId,
        role,
      },
    });
  }

  async updatePermissionRole({
    shortLinkId,
    targetLogin,
    newRole,
    currentUserLogin,
  }: {
    shortLinkId: string;
    targetLogin: string;
    newRole: 'viewer' | 'editor' | 'admin';
    currentUserLogin: string;
  }) {
    const currentUser = await this.prisma.user.findUnique({
      where: { login: currentUserLogin },
    });
    const targetUser = await this.prisma.user.findUnique({
      where: { login: targetLogin },
    });

    if (!currentUser || !targetUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (currentUser.id === targetUser.id) {
      throw new ConflictException('Нельзя изменить права самому себе');
    }

    const currentPermission = await this.prisma.editPermission.findFirst({
      where: { shortLinkId, userId: currentUser.id },
    });

    if (currentPermission?.role !== 'admin') {
      throw new ForbiddenException(
        'Недостаточно прав для обновления разрешений'
      );
    }

    const targetPermission = await this.prisma.editPermission.findFirst({
      where: { shortLinkId, userId: targetUser.id },
    });

    if (!targetPermission) {
      throw new NotFoundException('Права пользователя не найдены');
    }

    if (targetPermission.role === 'admin' && newRole !== 'admin') {
      // Не позволяем понизить последнего админа
      const admins = await this.prisma.editPermission.findMany({
        where: { shortLinkId, role: 'admin' },
      });
      if (admins.length <= 1) {
        throw new ConflictException(
          'Нельзя понизить последнего администратора'
        );
      }
    }

    return this.prisma.editPermission.update({
      where: { id: targetPermission.id },
      data: { role: newRole },
    });
  }

  // Удалить право редактирования
  async removePermission({
    shortLinkId,
    targetLogin,
    currentUserLogin,
  }: {
    shortLinkId: string;
    targetLogin: string;
    currentUserLogin: string;
  }) {
    const currentUser = await this.prisma.user.findUnique({
      where: { login: currentUserLogin },
    });
    const targetUser = await this.prisma.user.findUnique({
      where: { login: targetLogin },
    });

    if (!currentUser || !targetUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (currentUser.id === targetUser.id) {
      throw new ConflictException('Нельзя удалить права у самого себя');
    }

    // Проверяем, существует ли уже право редактирования
    const permission = await this.prisma.editPermission.findFirst({
      where: {
        userId: targetUser.id,
        shortLinkId: shortLinkId,
      },
    });

    if (!permission) {
      throw new NotFoundException(
        'Права редактирования для этого пользователя не существует'
      );
    }

    // Если пользователь — админ, проверим, не последний ли он
    if (permission.role === 'admin') {
      const adminCount = await this.prisma.editPermission.count({
        where: {
          shortLinkId,
          role: 'admin',
        },
      });

      if (adminCount <= 1) {
        throw new ConflictException('Нельзя удалить последнего администратора');
      }
    }

    const deletedPermission = await this.prisma.editPermission.deleteMany({
      where: {
        userId: targetUser.id,
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
    const userPermission = await this.prisma.editPermission.findFirst({
      where: { shortLinkId, userId },
    });

    if (userPermission?.role !== 'admin') {
      throw new ForbiddenException('Нет прав для просмотра разрешений');
    }

    const permissions = await this.prisma.editPermission.findMany({
      where: { shortLinkId, user: {id: {not: userId}} },
      include: { user: true },
    });

    return permissions.map((perm) => ({
      id: perm.user.id,
      login: perm.user.login,
      role: perm.role,
    }));
  }
}
