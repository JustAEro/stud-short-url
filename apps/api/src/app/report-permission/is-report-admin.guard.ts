
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IsReportAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.sub;
    const reportId = request.params.reportId;

    const shortLink = await this.prisma.report.findUnique({
      where: { id: reportId },
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
      throw new NotFoundException('Отчет не найден');
    }

    const isAdmin = shortLink.permissions.length > 0;

    if (!isAdmin) {
      throw new ForbiddenException('Вы не являетесь админом этого отчета');
    }

    return true;
  }
}
