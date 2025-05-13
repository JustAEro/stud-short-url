import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IsShortLinkAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.sub;
    const shortKey = request.params.shortKey;

    const shortLink = await this.prisma.shortLink.findUnique({
      where: { shortKey },
      select: {
        id: true,
        permissions: {
          where: {
            user: {id: userId},
            role: 'admin',
          },
          select: { id: true },
        },
      },
    });

    if (!shortLink) {
      throw new ForbiddenException('Ссылка не найдена');
    }

    const isAdmin = shortLink.permissions.length > 0;

    if (!isAdmin) {
      throw new ForbiddenException('Вы не являетесь админом этой ссылки');
    }

    return true;
  }
}
