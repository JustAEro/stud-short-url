import { Controller, Get, UseGuards, Request } from '@nestjs/common';

import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RequestUserPayloadDto } from '@stud-short-url/common';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getData(@Request() req: any) {
    return {
      data: this.appService.getData(),
      user: req.user as RequestUserPayloadDto,
    };
  }

  @Get('health')
  healthCheck() {
    return { status: 'ok' };
  }
}
