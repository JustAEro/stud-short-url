import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { ShortLinkService } from './short-link.service';
import { LinkStatService } from '../link-stat/link-stat.service';
import { UAParser } from 'ua-parser-js';
import { CreateShortLinkDto, ShortLinkDto } from '@stud-short-url/common';

@Controller('short-links')
export class ShortLinkController {
  constructor(
    private readonly shortLinkService: ShortLinkService,
    private readonly linkStatService: LinkStatService
  ) {}

  @Get()
  async getAllShortLinks() {
    return await this.shortLinkService.getAllLinks();
  }

  @Get(':shortKey')
  async getLinkByShortKey(
    @Param('shortKey') shortKey: string,
    @Req() req: Request
  ): Promise<ShortLinkDto> {
    const link = await this.shortLinkService.getLink({ shortKey });

    if (!link) {
      throw new NotFoundException('link not found');
    }

    const parser = new UAParser((req.headers as any)['user-agent']);
    const browser = parser.getBrowser().name || 'Unknown';
    const deviceType = parser.getDevice().type?.toUpperCase() || 'DESKTOP';
    const referrer = (req.headers as any).referrer;

    this.linkStatService.registerClick({
      shortKey,
      deviceType,
      browser,
      referrer,
    });

    return link;
  }

  @Get('no-stats/:shortKey')
  async getLinkByShortKeyWithoutStatsUpdate(
    @Param('shortKey') shortKey: string
  ): Promise<ShortLinkDto> {
    const link = await this.shortLinkService.getLink({ shortKey });

    if (!link) {
      throw new NotFoundException('link not found');
    }

    return link;
  }

  @Post()
  async createLink(@Body() linkData: CreateShortLinkDto) {
    const shortKey = this.shortLinkService.generateUrlSafeString();

    return await this.shortLinkService.createLink({
      longLink: linkData.longLink,
      shortKey,
      description: linkData.description,
      user: {
        connect: { login: linkData.login },
      },
    });
  }

  @Put(':shortKey')
  async updateLinkByShortKey(
    @Param('shortKey') shortKey: string,
    @Body() linkData: { longLink: string }
  ) {
    return await this.shortLinkService.updateLink({
      where: { shortKey },
      data: linkData,
    });
  }

  @Delete(':shortKey')
  async deleteLinkByShortKey(@Param('shortKey') shortKey: string) {
    return await this.shortLinkService.deleteLink({ shortKey });
  }
}
