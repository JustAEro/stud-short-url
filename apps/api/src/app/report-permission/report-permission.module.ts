import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportPermissionController } from './report-permission.controller';
import { ReportPermissionService } from './report-permission.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReportPermissionController],
  providers: [ReportPermissionService],
  exports: [ReportPermissionService],
})
export class ReportPermissionModule {}
