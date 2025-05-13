import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Get,
  Req,
  Patch,
} from '@nestjs/common';
import { EditPermissionService } from './edit-permission.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  RequestUserPayloadDto,
  UpdatePermissionRoleDto,
} from '@stud-short-url/common';

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
    @Body()
    { login, role }: { login: string; role: 'viewer' | 'editor' | 'admin' },
    @Req() req: any
  ) {
    const user: RequestUserPayloadDto = req.user;

    return this.editPermissionService.addPermission({
      shortLinkId,
      login,
      role,
      currentUserLogin: user.login,
    });
  }

  @Patch('update/:shortLinkId')
  async updatePermissionRole(
    @Param('shortLinkId') shortLinkId: string,
    @Body() dto: UpdatePermissionRoleDto,
    @Req() req: any
  ) {
    const user: RequestUserPayloadDto = req.user;

    const currentUserLogin = user.login;

    return this.editPermissionService.updatePermissionRole({
      shortLinkId,
      targetLogin: dto.login,
      newRole: dto.role,
      currentUserLogin,
    });
  }

  // Удалить право редактирования
  @Delete('remove/:shortLinkId/login/:login')
  removePermission(
    @Param('shortLinkId') shortLinkId: string,
    @Param('login') login: string,
    @Req() req: any
  ) {
    const user: RequestUserPayloadDto = req.user;

    const currentUserLogin = user.login;

    return this.editPermissionService.removePermission({
      shortLinkId,
      targetLogin: login,
      currentUserLogin,
    });
  }
}
