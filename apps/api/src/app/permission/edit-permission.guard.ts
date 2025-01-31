import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EditPermissionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user.sub;
    const shortKey = req.params.shortKey;

    const shortLink = await this.prisma.shortLink.findUnique({
      where: { shortKey },
      include: { permissions: true },
    });

    if (!shortLink) {
      throw new ForbiddenException('Ссылка не найдена');
    }

    const isOwner = shortLink.createdByUserId === userId;
    const hasPermission = shortLink.permissions.some(
      (p) => p.userId === userId
    );

    if (!isOwner && !hasPermission) {
      throw new ForbiddenException('Нет прав на редактирование');
    }

    return true;
  }
}
