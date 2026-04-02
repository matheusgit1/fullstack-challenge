import { ProvablyFairModule } from "@/application/services/provably-fair/provably-fair.module";
import { ServicesModule } from "@/application/services/services.module";
import { BET_REPOSITORY } from "@/domain/orm/repositories/bet.repository";
import { ROUND_REPOSITORY } from "@/domain/orm/repositories/round.repository";
import { WALLET_PROXY } from "@/domain/proxy/wallet.proxy";
import { RABBITMQ_PRODUCER_SERVICE } from "@/domain/rabbitmq/rabbitmq.producer";
import { AuthGuard } from "@/infrastructure/auth/auth.guard";
import { AuthModule } from "@/infrastructure/auth/auth.module";
import { OrmModule } from "@/infrastructure/database/orm/orm.module";
import { BetRepository } from "@/infrastructure/database/orm/repository/bet.repository";
import { RoundRepository } from "@/infrastructure/database/orm/repository/round.repository";
import { TimerModule } from "@/infrastructure/events/timer/timer.module";
import { TimerService } from "@/infrastructure/events/timer/timer.service";
import { GlobalExceptionFilter } from "@/infrastructure/filters/global-execeptions.filters";
import { LoggingInterceptor } from "@/infrastructure/interceptor/logging.interceptor";
import { TracingMiddleware } from "@/infrastructure/middleware/tracing.middleware";
import { ProxyModule } from "@/infrastructure/proxy/proxy.module";
import { WalletProxy } from "@/infrastructure/proxy/services/wallets.service";
import { RabbitmqModule } from "@/infrastructure/rabbitmq/rabbitmq.module";
import { RabbitmqProducerService } from "@/infrastructure/rabbitmq/rabbitmq.producer";
import { WebsocketModule } from "@/infrastructure/websocket/websocket.module";
import { GamesController } from "@/presentation/controllers/games.controller";
import { GamesManager } from "@/presentation/manager/games.manager";
import { BetUseCase } from "@/presentation/usecases/bet.usecase";
import { CashOutUsecase } from "@/presentation/usecases/cashout.usecase";
import { CurrentRoundUseCase } from "@/presentation/usecases/current-round.usecase";
import { HistoryRoundUsecase } from "@/presentation/usecases/history-round.usecase";
import { GetMyBetsUseCase } from "@/presentation/usecases/my-bets.usecase";
import { VerifyRoundUsecase } from "@/presentation/usecases/verify-round.usecase";
import { HttpModule } from "@nestjs/axios";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    TimerModule,
    AuthModule,
    OrmModule,
    ServicesModule,
    ProvablyFairModule,
    ProxyModule,
    RabbitmqModule,
    WebsocketModule,
  ],
  controllers: [GamesController],
  providers: [
    ConfigService,
    GamesManager,
    TimerService,
    CurrentRoundUseCase,
    HistoryRoundUsecase,
    VerifyRoundUsecase,
    GetMyBetsUseCase,
    BetUseCase,
    CashOutUsecase,
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
    {
      provide: RABBITMQ_PRODUCER_SERVICE,
      useClass: RabbitmqProducerService,
    },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TracingMiddleware).forRoutes("*");
  }
}
