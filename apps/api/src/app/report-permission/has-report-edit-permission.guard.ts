import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HasReportEditPermissionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user.sub;
    const reportId = req.params.reportId;

    const shortLink = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: {
        permissions: {
          where: {
            user: { id: userId },
            role: { in: ['editor', 'admin'] },
          },
          select: { id: true },
        },
      },
    });

    if (!shortLink) {
      throw new NotFoundException('Отчет не найден');
    }

    const hasEditPermission = shortLink.permissions.length > 0;

    if (!hasEditPermission) {
      throw new ForbiddenException('Нет прав на редактирование');
    }

    return true;
  }
}
