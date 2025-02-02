import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ShortLinkService } from './short-link.service';
import { LinkStatService } from '../link-stat/link-stat.service';
import { UAParser } from 'ua-parser-js';
import {
  CreateShortLinkDto,
  RequestUserPayloadDto,
  ShortLinkDto,
  ShortLinkWithPermissionsDto,
  UpdateShortLinkDto,
} from '@stud-short-url/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EditPermissionGuard } from '../permission/edit-permission.guard';
import { IsOwnerGuard } from '../permission/is-owner.guard';

@Controller('short-links')
export class ShortLinkController {
  constructor(
    private readonly shortLinkService: ShortLinkService,
    private readonly linkStatService: LinkStatService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllShortLinks(
    @Query('sortBy')
    sortBy: 'updatedAt' | 'createdAt' | 'description' | undefined,

    @Query('sortDirection')
    direction: 'asc' | 'desc' | undefined,

    @Query('search')
    search = '',

    @Query('page')
    page = 1,

    @Query('limit')
    limit = 5,

    @Request() req: any
  ) {
    const user: RequestUserPayloadDto = req.user;

    return await this.shortLinkService.findAllSorted({
      sortBy,
      direction,
      search,
      page,
      limit,
      userId: user.sub,
    });
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

  @UseGuards(JwtAuthGuard, EditPermissionGuard)
  @Get('no-stats/:shortKey')
  async getLinkByShortKeyWithoutStatsUpdate(
    @Param('shortKey') shortKey: string,
    @Request() req: any
  ): Promise<ShortLinkWithPermissionsDto> {
    const user: RequestUserPayloadDto = req.user;

    const link = await this.shortLinkService.getShortLinkByKey({
      shortKey,
      userId: user.sub,
    });

    if (!link) {
      throw new NotFoundException('link not found');
    }

    return link;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createLink(@Body() linkData: CreateShortLinkDto): Promise<ShortLinkDto> {
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

  @UseGuards(JwtAuthGuard, EditPermissionGuard)
  @Put(':shortKey')
  async updateLinkByShortKey(
    @Param('shortKey') shortKey: string,
    @Body() linkData: UpdateShortLinkDto
  ): Promise<ShortLinkDto> {
    return await this.shortLinkService.updateLink({
      where: { shortKey },
      data: linkData,
    });
  }

  @UseGuards(JwtAuthGuard, IsOwnerGuard)
  @Delete(':shortKey')
  async deleteLinkByShortKey(@Param('shortKey') shortKey: string) {
    return await this.shortLinkService.deleteLink({ shortKey });
  }
}
