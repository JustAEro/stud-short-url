
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        if (err || !user) {
          throw new UnauthorizedException('Неверные учетные данные');
        }
        return user;
      }
}
