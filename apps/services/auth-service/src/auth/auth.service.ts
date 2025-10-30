import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RabbitMQService, BlogEvent } from '@blog/shared-rabbitmq';
import { AppLogger } from '@blog/shared-logger';
// import { RequestContext } from '@blog/shared-types';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly authRepository: AuthRepository,
    private rabbitMQService: RabbitMQService,
    private appLogger: AppLogger,
  ) {
    this.appLogger.setContext(AuthService.name);
  }

  async onModuleInit() {
    // Don't try to subscribe to events immediately
    // Let the service start first, then handle events lazily
    this.appLogger.logServiceCall('auth', 'Auth service initialized');
  }

  private async handleEvent(event: BlogEvent) {
    switch (event.type) {
      case 'user.logged_out':
        // Handle logout event if needed
        this.appLogger.logServiceCall('auth', 'User logged out event received', { eventData: event.data });
        break;
      default:
        this.appLogger.logServiceCall('auth', 'Unhandled event in auth service', { eventType: event.type });
    }
  }

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const user = await this.authRepository.createUser(registerDto, hashedPassword);

    // Publish user registered event
    const event = await this.rabbitMQService.createEvent(
      'user.registered',
      {
        userId: user.id,
        email: user.email,
        username: user.username,
      },
      'auth',
    );
    await this.rabbitMQService.publishEvent(event);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.authRepository.findUserByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate a simple session token
    const token = this.generateToken();
    
    const session = await this.authRepository.createSession(
      user.id,
      token,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    );

    // Publish user logged in event
    const event = await this.rabbitMQService.createEvent(
      'user.logged_in',
      {
        userId: user.id,
        email: user.email,
        sessionId: session.id,
      },
      'auth',
    );
    await this.rabbitMQService.publishEvent(event);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  async validateToken(token: string) {
    const session = await this.authRepository.findSessionByToken(token);

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return session.user;
  }

  async logout(token: string) {
    const session = await this.authRepository.findSessionByToken(token);

    if (session) {
      // Publish user logged out event
      const event = await this.rabbitMQService.createEvent(
        'user.logged_out',
        {
          userId: session.userId,
          sessionId: session.id,
        },
        'auth',
      );
      await this.rabbitMQService.publishEvent(event);
    }

    await this.authRepository.deleteSessionsByToken(token);
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}


