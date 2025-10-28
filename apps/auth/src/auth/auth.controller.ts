import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('validate')
  async validate(@Body('token') token: string) {
    const user = await this.authService.validateToken(token);
    return { valid: !!user, user };
  }

  @Post('logout')
  async logout(@Body('token') token: string) {
    await this.authService.logout(token);
    return { message: 'Logged out successfully' };
  }
}


