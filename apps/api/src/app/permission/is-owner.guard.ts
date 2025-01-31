import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IsOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.sub; // Получаем ID пользователя
    const shortKey = request.params.shortKey; // Получаем ID ссылки

    // Ищем ссылку в базе
    const shortLink = await this.prisma.shortLink.findUnique({
      where: { shortKey },
    });

    if (!shortLink) {
      throw new ForbiddenException('Ссылка не найдена');
    }

    if (shortLink.createdByUserId !== userId) {
      throw new ForbiddenException('Вы не являетесь владельцем этой ссылки');
    }

    return true;
  }
}
