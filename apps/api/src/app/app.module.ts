import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShortLinkModule } from './short-link/short-link.module';
import { LinkStatModule } from './link-stat/link-stat.module';
import { AuthModule } from './auth/auth.module';
import { EditPermissionModule } from './permission/edit-permission.module';
import { ReportModule } from './report/report.module';
import { ReportPermissionModule } from './report-permission/report-permission.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
    }),
    UserModule,
    PrismaModule,
    ShortLinkModule,
    LinkStatModule,
    AuthModule,
    EditPermissionModule,
    ReportModule,
    ReportPermissionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
