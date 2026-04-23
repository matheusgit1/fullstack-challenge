import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthGuard } from '@/application/auth/auth.guard';
import { TimerModule } from '@/application/events/timer/timer.module';
import { GameModule } from '@/application/game/game.module';
import { BET_REPOSITORY } from '@/domain/orm/repositories/bet.repository';
import { ROUND_REPOSITORY } from '@/domain/orm/repositories/round.repository';
import { WALLET_PROXY } from '@/domain/proxy/wallet.proxy';
import { GlobalExceptionFilter } from '@/filters/global-execeptions.filters';
import { OrmModule } from '@/infrastructure/database/orm/orm.module';
import { BetRepository } from '@/infrastructure/database/orm/repository/bet.repository';
import { RoundRepository } from '@/infrastructure/database/orm/repository/round.repository';
import { ProxyModule } from '@/infrastructure/proxy/proxy.module';
import { WalletProxy } from '@/infrastructure/proxy/wallets.proxy';
import { RabbitmqModule } from '@/infrastructure/rabbitmq/rabbitmq.module';
import { WebsocketModule } from '@/infrastructure/websocket/websocket.module';
import { LoggingInterceptor } from '@/interceptor/logging.interceptor';
import { TracingMiddleware } from '@/middleware/tracing.middleware';
import { GamesController } from '@/presentation/controllers/games.controller';
import { GamesManager } from '@/presentation/manager/games.manager';
import { BetUseCase } from '@/presentation/usecases/bet.usecase';
import { CashOutUsecase } from '@/presentation/usecases/cashout.usecase';
import { CurrentRoundUseCase } from '@/presentation/usecases/current-round.usecase';
import { HistoryRoundUsecase } from '@/presentation/usecases/history-round.usecase';
import { GetMyBetsUseCase } from '@/presentation/usecases/my-bets.usecase';
import { AuthModule } from '@/application/auth/auth.module';
import { AuthController } from '@/application/auth/auth.controller';
import { EventModule } from '@/application/events/event/event.module';
import { AuditRoundUsecase } from '@/presentation/usecases/audit-round.usecase';
import { ResponseInterceptor } from '@/interceptor/response.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot({}),
    EventModule,
    TimerModule,
    AuthModule,
    OrmModule,
    GameModule,
    ProxyModule,
    RabbitmqModule,
    WebsocketModule,
  ],
  controllers: [AuthController, GamesController],
  providers: [
    GamesManager,
    CurrentRoundUseCase,
    HistoryRoundUsecase,
    GetMyBetsUseCase,
    BetUseCase,
    CashOutUsecase,
    AuditRoundUsecase,
    {
      provide: ROUND_REPOSITORY,
      useClass: RoundRepository,
    },
    {
      provide: BET_REPOSITORY,
      useClass: BetRepository,
    },
    {
      provide: WALLET_PROXY,
      useClass: WalletProxy,
    },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TracingMiddleware).forRoutes('*');
  }
}

    