import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(registerDto: RegisterDto, hashedPassword: string) {
    return this.prisma.user.create({
      data: {
        email: registerDto.email,
        username: registerDto.username,
        password: hashedPassword,
      },
    });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createSession(userId: string, token: string, expiresAt: Date) {
    return this.prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  async findSessionByToken(token: string) {
    return this.prisma.session.findUnique({ where: { token }, include: { user: true } });
  }

  async deleteSessionsByToken(token: string) {
    return this.prisma.session.deleteMany({ where: { token } });
  }
}
