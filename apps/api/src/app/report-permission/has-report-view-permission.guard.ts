import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HasReportViewPermissionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user.sub;
    const reportId = req.params.reportId;

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
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

    if (!report) {
      throw new NotFoundException('Отчет не найден');
    }

    const hasViewPermission = report.permissions.length > 0;

    if (!hasViewPermission) {
      throw new ForbiddenException('Нет прав на просмотр отчета');
    }

    return true;
  }
}
