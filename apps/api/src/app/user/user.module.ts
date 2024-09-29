import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], //import prisma module to use prisma service in your module
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}