import { ConfigModule } from '@nestjs/config';
import { WalletRepository } from '@/infrastructure/database/orm/repository/wallet.repository';
import { WalletsController } from '@/presentation/controllers/wallets.controller';
import { WalletsService } from '@/presentation/services/wallets.service';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { OrmModule } from '@/infrastructure/database/orm/orm.module';
import { RabbitmqModule } from '@/infrastructure/rabbitmq/rabbitmq.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from '@/application/auth/auth.module';
import { AuthGuard } from '@/application/auth/auth.guard';
import { LoggingInterceptor } from '@/interceptor/logging.interceptor';
import { GlobalExceptionFilter } from '@/filters/global-execeptions.filters';
import { WALLET_REPOSITORY } from '@/domain/orm/repositories/wallet.repository';
import { TracingMiddleware } from '@/middleware/middleware/tracing.middleware';

@Module({
  imports: [AuthModule, OrmModule, RabbitmqModule, ConfigModule.forRoot()],
  controllers: [WalletsController],
  providers: [
    WalletsService,
    { provide: WALLET_REPOSITORY, useClass: WalletRepository },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TracingMiddleware).forRoutes('*');
  }
}
