import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportPermissionService {
  constructor(private prisma: PrismaService) {}

  // Назначить создателя отчета админом сразу после создания
  async grantAdminToCreator(reportId: string, creatorUserId: string) {
    const existing = await this.prisma.reportPermission.findFirst({
      where: {
        reportId,
        userId: creatorUserId,
      },
    });

    if (existing) {
      throw new ConflictException('Создателю уже назначены права');
    }

    return this.prisma.reportPermission.create({
      data: {
        reportId,
        userId: creatorUserId,
        role: 'admin',
      },
    });
  }

  // Добавить право редактирования
  async addPermission({
    reportId,
    login,
    role,
    currentUserLogin,
  }: {
    reportId: string;
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

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) throw new NotFoundException('Ссылка не найдена');

    const currentPermission = await this.prisma.reportPermission.findFirst({
      where: { reportId, userId: currentUser.id },
    });

    if (currentPermission?.role !== 'admin') {
      throw new ForbiddenException(
        'Недостаточно прав для добавления разрешений'
      );
    }

    const existingPermission = await this.prisma.reportPermission.findFirst({
      where: {
        userId: targetUser.id,
        reportId,
      },
    });

    if (existingPermission) {
      throw new ConflictException('Пользователь уже имеет права');
    }

    return this.prisma.reportPermission.create({
      data: {
        userId: targetUser.id,
        reportId,
        role,
      },
    });
  }

  async updatePermissionRole({
    reportId,
    targetLogin,
    newRole,
    currentUserLogin,
  }: {
    reportId: string;
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

    const currentPermission = await this.prisma.reportPermission.findFirst({
      where: { reportId, userId: currentUser.id },
    });

    if (currentPermission?.role !== 'admin') {
      throw new ForbiddenException(
        'Недостаточно прав для обновления разрешений'
      );
    }

    const targetPermission = await this.prisma.reportPermission.findFirst({
      where: { reportId, userId: targetUser.id },
    });

    if (!targetPermission) {
      throw new NotFoundException('Права пользователя не найдены');
    }

    if (targetPermission.role === 'admin' && newRole !== 'admin') {
      // Не позволяем понизить последнего админа
      const admins = await this.prisma.reportPermission.findMany({
        where: { reportId, role: 'admin' },
      });
      if (admins.length <= 1) {
        throw new ConflictException(
          'Нельзя понизить последнего администратора'
        );
      }
    }

    return this.prisma.reportPermission.update({
      where: { id: targetPermission.id },
      data: { role: newRole },
    });
  }

  // Удалить право редактирования
  async removePermission({
    reportId,
    targetLogin,
    currentUserLogin,
  }: {
    reportId: string;
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
    const permission = await this.prisma.reportPermission.findFirst({
      where: {
        userId: targetUser.id,
        reportId,
      },
    });

    if (!permission) {
      throw new NotFoundException(
        'Права редактирования для этого пользователя не существует'
      );
    }

    // Если пользователь — админ, проверим, не последний ли он
    if (permission.role === 'admin') {
      const adminCount = await this.prisma.reportPermission.count({
        where: {
          reportId,
          role: 'admin',
        },
      });

      if (adminCount <= 1) {
        throw new ConflictException('Нельзя удалить последнего администратора');
      }
    }

    const deletedPermission = await this.prisma.reportPermission.deleteMany({
      where: {
        userId: targetUser.id,
        reportId,
      },
    });

    return deletedPermission;
  }

  // Проверка, имеет ли пользователь права на редактирование
  async hasEditPermission({
    reportId,
    userId,
  }: {
    reportId: string;
    userId: string;
  }) {
    const permission = await this.prisma.reportPermission.findFirst({
      where: {
        reportId,
        userId: userId,
      },
    });

    return !!permission;
  }

  async getPermissions(reportId: string, userId: string) {
    const userPermission = await this.prisma.reportPermission.findFirst({
      where: { reportId, userId },
    });

    if (userPermission?.role !== 'admin') {
      throw new ForbiddenException('Нет прав для просмотра разрешений');
    }

    const permissions = await this.prisma.reportPermission.findMany({
      where: { reportId, user: {id: {not: userId}} },
      include: { user: true },
    });

    return permissions.map((perm) => ({
      id: perm.user.id,
      login: perm.user.login,
      role: perm.role,
    }));
  }
}
