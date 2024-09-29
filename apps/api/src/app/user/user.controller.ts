import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
  } from '@nestjs/common';
  import { UserService } from './user.service';
  import { User } from '@prisma/client';
  
  @Controller('users')
  export class UserController {
    constructor(private readonly userService: UserService) {}
  
    @Get()
    async getAllUsers() {
      return this.userService.getAllUsers();
    }
  
    @Get(':id')
    async getUser(@Param('id') id: string) {
      return this.userService.getUser({ id });
    }
  
    @Post()
    async signupUser(@Body() userData: { login: string; password: string;}): Promise<User> {
      return this.userService.createUser(userData);
    }
  
    @Put(':id')
    async updateUser(
      @Param('id') id: string,
      @Body() userData: {login: string; password: string;},
    ): Promise<User> {
      return this.userService.updateUser({
        where: { id },
        data: userData,
      });
    }
  
    @Delete(':id')
    async deleteUser(@Param('id') id: string): Promise<User> {
      return this.userService.deleteUser({ id });
    }
  }