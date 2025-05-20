import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ReportService } from "./report.service";
import { ReportController } from "./report.controller";
import { LinkStatModule } from "../link-stat/link-stat.module";

@Module({
  imports: [PrismaModule, LinkStatModule],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [],
})
export class ReportModule {}
