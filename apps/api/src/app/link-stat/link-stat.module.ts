import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { LinkStatService } from "./link-stat.service";

@Module({
    imports: [PrismaModule],
    providers: [LinkStatService],
    exports: [LinkStatService],
})
export class LinkStatModule {}