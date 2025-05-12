import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ViewPermissionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user.sub;
    const shortKey = req.params.shortKey;

    const shortLink = await this.prisma.shortLink.findUnique({
      where: { shortKey },
      select: {
        permissions: {
          where: {
            user: { id: userId },
            role: { in: ['viewer', 'editor', 'admin'] },
          },
          select: { id: true },
        },
      },
    });

    if (!shortLink) {
      throw new ForbiddenException('Ссылка не найдена');
    }

    const hasEditPermission = shortLink.permissions.length > 0;

    if (!hasEditPermission) {
      throw new ForbiddenException('Нет прав на редактирование');
    }

    return true;
  }
}
