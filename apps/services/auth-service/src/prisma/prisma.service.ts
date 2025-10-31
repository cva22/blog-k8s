import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { AppLogger } from '@blog/shared-logger';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger: AppLogger;

  constructor(private configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');

    const adapter = new PrismaPg({ connectionString: databaseUrl });
    super({ adapter });
    
    this.logger = new AppLogger();
    this.logger.setContext('PrismaService');
  }

  async onModuleInit() {
    try {
      await this.$connect();
      
      // Verify database connection with a simple query
      await this.$queryRaw`SELECT 1`;
      this.logger.logServiceCall('auth', 'Database connection verified successfully');
    } catch (error) {
      this.logger.logServiceError('auth', 'Failed to connect to database', { error });
      this.logger.logServiceError('auth', 'Service will not start without database connection');
      process.exit(1);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
