import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ShortLinkService } from "./short-link.service";
import crypto from "node:crypto";

@Controller('short-links')
export class ShortLinkController {
    constructor(private readonly shortLinkService: ShortLinkService) {}

    @Get()
    async getAllShortLinks() {
        return await this.shortLinkService.getAllLinks();
    }

    @Get(':shortKey')
    async getLinkByShortKey(@Param('shortKey') shortKey: string) {
        const link = await this.shortLinkService.getLink({shortKey});

        return link;
    }

    @Post()
    async createLink(@Body() linkData: { login: string; longLink: string;}) {
        const shortKey = crypto.createHash('md5').update(linkData.longLink).digest('base64url').slice(0, 8);

        return await this.shortLinkService.createLink({
            longLink: linkData.longLink,
            shortKey,
            user: {
                connect: {login: linkData.login}
            }
        });
    }
}