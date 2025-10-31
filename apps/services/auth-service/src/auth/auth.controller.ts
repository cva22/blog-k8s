import { Controller, Post, Body, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenDto } from './dto/token.dto';
import { AppLogger } from '@blog/shared-logger';
import { createRequestContext } from '@blog/shared-middleware';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private appLogger: AppLogger,
  ) {
    this.appLogger.setContext(AuthController.name);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto, @Request() req: any) {
    const ctx = createRequestContext(req);
    this.appLogger.log(ctx, 'User registration attempt', { email: registerDto.email });
    
    try {
      const result = await this.authService.register(registerDto);
      this.appLogger.log(ctx, 'User registered successfully', { userId: result.id });
      return result;
    } catch (error) {
      this.appLogger.error(ctx, 'User registration failed', { error: error.message });
      throw error;
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Request() req: any) {
    const ctx = createRequestContext(req);
    this.appLogger.log(ctx, 'User login attempt', { email: loginDto.email });
    
    try {
      const result = await this.authService.login(loginDto);
      this.appLogger.log(ctx, 'User logged in successfully', { userId: result.user.id });
      return result;
    } catch (error) {
      this.appLogger.error(ctx, 'User login failed', { error: error.message });
      throw error;
    }
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate authentication token' })
  @ApiBody({ type: TokenDto })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  async validate(@Body() tokenDto: TokenDto, @Request() req: any) {
    const ctx = createRequestContext(req);
    this.appLogger.log(ctx, 'Token validation attempt');
    
    try {
      const user = await this.authService.validateToken(tokenDto.token);
      this.appLogger.log(ctx, 'Token validation completed', { valid: !!user });
      return { valid: !!user, user };
    } catch (error) {
      this.appLogger.error(ctx, 'Token validation failed', { error: error.message });
      throw error;
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiBody({ type: TokenDto })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  async logout(@Body() tokenDto: TokenDto, @Request() req: any) {
    const ctx = createRequestContext(req);
    this.appLogger.log(ctx, 'User logout attempt');
    
    try {
      await this.authService.logout(tokenDto.token);
      this.appLogger.log(ctx, 'User logged out successfully');
      return { message: 'Logged out successfully' };
    } catch (error) {
      this.appLogger.error(ctx, 'User logout failed', { error: error.message });
      throw error;
    }
  }
}


