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
import { ReportPermissionService } from './report-permission.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  RequestUserPayloadDto,
  UpdatePermissionRoleDto,
} from '@stud-short-url/common';

@UseGuards(JwtAuthGuard)
@Controller('report-permission')
export class ReportPermissionController {
  constructor(
    private readonly reportPermissionService: ReportPermissionService
  ) {}

  @Get(':reportId')
  async getPermissions(@Param('reportId') reportId: string, @Req() req: any) {
    return this.reportPermissionService.getPermissions(reportId, req.user.sub);
  }

  // Добавить право редактирования
  @Post('add/:reportId')
  addPermission(
    @Param('reportId') reportId: string,
    @Body()
    { login, role }: { login: string; role: 'viewer' | 'editor' | 'admin' },
    @Req() req: any
  ) {
    const user: RequestUserPayloadDto = req.user;

    return this.reportPermissionService.addPermission({
      reportId,
      login,
      role,
      currentUserLogin: user.login,
    });
  }

  @Patch('update/:reportId')
  async updatePermissionRole(
    @Param('reportId') reportId: string,
    @Body() dto: UpdatePermissionRoleDto,
    @Req() req: any
  ) {
    const user: RequestUserPayloadDto = req.user;

    const currentUserLogin = user.login;

    return this.reportPermissionService.updatePermissionRole({
      reportId,
      targetLogin: dto.login,
      newRole: dto.role,
      currentUserLogin,
    });
  }

  // Удалить право редактирования
  @Delete('remove/:reportId/login/:login')
  removePermission(
    @Param('reportId') reportId: string,
    @Param('login') login: string,
    @Req() req: any
  ) {
    const user: RequestUserPayloadDto = req.user;

    const currentUserLogin = user.login;

    return this.reportPermissionService.removePermission({
      reportId,
      targetLogin: login,
      currentUserLogin,
    });
  }
}
