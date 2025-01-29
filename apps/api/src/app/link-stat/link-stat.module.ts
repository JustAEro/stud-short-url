import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { LinkStatService } from "./link-stat.service";
import { LinkStatController } from "./link-stat.controller";

@Module({
    imports: [PrismaModule],
    providers: [LinkStatService],
    exports: [LinkStatService],
    controllers: [LinkStatController],
})
export class LinkStatModule {}