import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async validateUser(login: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { login } });

    if (user && bcrypt.compareSync(password, user.password)) {
      return user;
    }

    return null;
  }

  async login(user: { id: string; login: string }) {
    const payload = { login: user.login, sub: user.id };

    console.log('Payload before signing:', payload);
    console.log('JWT_SECRET used for signing:', process.env.JWT_SECRET);

    const token = this.jwtService.sign(payload, { secret: process.env.JWT_SECRET });

    console.log('Generated Token:', token);

    return {
      accessToken: token,
      login: user.login,
    };
  }

  async register(login: string, password: string) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    try {
      const user = await this.prisma.user.create({
        data: { login, password: hashedPassword },
      });

      return user;
    } catch (error) {
      throw new ConflictException('Пользователь с таким логином уже существует');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { accessToken: null },
    });
  }
}
