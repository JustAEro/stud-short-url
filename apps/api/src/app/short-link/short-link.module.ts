import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ShortLinkController } from "./short-link.controller";
import { ShortLinkService } from "./short-link.service";
import { LinkStatModule } from "../link-stat/link-stat.module";
import { AuthModule } from "../auth/auth.module";
import { EditPermissionModule } from "../permission/edit-permission.module";

@Module({
    imports: [PrismaModule, LinkStatModule, AuthModule, EditPermissionModule],
    controllers: [ShortLinkController],
    providers: [ShortLinkService],
})
export class ShortLinkModule {}
