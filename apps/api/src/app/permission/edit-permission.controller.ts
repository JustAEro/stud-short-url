import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import { EditPermissionService } from './edit-permission.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestUserPayloadDto } from '@stud-short-url/common';

@UseGuards(JwtAuthGuard)
@Controller('edit-permission')
export class EditPermissionController {
  constructor(private readonly editPermissionService: EditPermissionService) {}

  @Get(':id')
  async getPermissions(@Param('id') shortLinkId: string, @Req() req: any) {
    return this.editPermissionService.getPermissions(shortLinkId, req.user.sub);
  }

  // Добавить право редактирования
  @Post('add/:shortLinkId')
  addPermission(
    @Param('shortLinkId') shortLinkId: string,
    @Body() { login }: { login: string },
    @Req() req: any
  ) {
    const user: RequestUserPayloadDto = req.user;

    return this.editPermissionService.addPermission({
      shortLinkId,
      login,
      currentUserLogin: user.login,
    });
  }

  // Удалить право редактирования
  @Delete('remove/:shortLinkId/login/:login')
  removePermission(
    @Param('shortLinkId') shortLinkId: string,
    @Param('login') login: string
  ) {
    return this.editPermissionService.removePermission({ shortLinkId, login });
  }
}
