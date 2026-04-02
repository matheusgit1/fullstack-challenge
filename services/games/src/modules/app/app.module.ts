import { ProvablyFairModule } from "@/application/services/provably-fair/provably-fair.module";
import { ServicesModule } from "@/application/services/services.module";
import { AuthGuard } from "@/infrastructure/auth/auth.guard";
import { AuthModule } from "@/infrastructure/auth/auth.module";
import { OrmModule } from "@/infrastructure/database/orm/orm.module";
import { RoundRepository } from "@/infrastructure/database/orm/repository/round.repository";
import { TimerService } from "@/infrastructure/events/timer.service";
import { GlobalExceptionFilter } from "@/infrastructure/filters/global-execeptions.filters";
import { LoggingInterceptor } from "@/infrastructure/interceptor/logging.interceptor";
import { ResponseInterceptor } from "@/infrastructure/interceptor/response.interceptor";
import { TracingMiddleware } from "@/infrastructure/middleware/tracing.middleware";
import { ProxyModule } from "@/infrastructure/proxy/proxy.module";
import { WalletProxy } from "@/infrastructure/proxy/services/wallets.service";
import { RabbitmqModule } from "@/infrastructure/rabbitmq/rabbitmq.module";
import { RabbitmqProducerService } from "@/infrastructure/rabbitmq/rabbitmq.producer";
import { WebsocketModule } from "@/infrastructure/websocket/websocket.module";
import { GamesController } from "@/presentation/controllers/games.controller";
import { GamesManager } from "@/presentation/services/games.manager";
import { GamesService } from "@/presentation/services/games.service";
import { HttpModule } from "@nestjs/axios";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: ".",
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
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
    GamesService,
    TimerService,
    RoundRepository,
    WalletProxy,
    GamesManager,
    RabbitmqProducerService,
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TracingMiddleware).forRoutes("*");
  }
}
