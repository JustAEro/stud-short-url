import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
    constructor(private jwtService: JwtService, private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
    
        if (!authHeader) {
          throw new UnauthorizedException('Токен не найден');
        }
    
        const [bearer, token] = authHeader.split(' ');
    
        if (bearer !== 'Bearer' || !token) {
          throw new UnauthorizedException('Неверный формат токена');
        }
    
        try {
          // console.log('Received token:', token);
          // console.log('JWT_SECRET used for verifying:', process.env.JWT_SECRET);

          const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });

          // console.log('Decoded payload:', payload);

          request.user = payload; // Добавляем пользователя в request

          return true;
        } catch (error: any) {
          console.error('JWT verification failed:', error.message);
          throw new UnauthorizedException('Недействительный токен');
        }
      }
}
