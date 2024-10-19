import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ShortLinkController } from "./short-link.controller";
import { ShortLinkService } from "./short-link.service";

@Module({
    imports: [PrismaModule],
    controllers: [ShortLinkController],
    providers: [ShortLinkService],
})
export class ShortLinkModule {}
