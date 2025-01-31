import { Module } from '@nestjs/common';
import { EditPermissionController } from './edit-permission.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EditPermissionService } from './edit-permission.service';

@Module({
  imports: [PrismaModule],
  controllers: [EditPermissionController],
  providers: [EditPermissionService],
})
export class EditPermissionModule {}
