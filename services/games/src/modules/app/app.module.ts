import { ProvablyFairModule } from "@/application/services/provably-fair/provably-fair.module";
import { ServicesModule } from "@/application/services/services.module";
import { AuthGuard } from "@/infrastructure/auth/auth.guard";
import { AuthModule } from "@/infrastructure/auth/auth.module";
import { OrmModule } from "@/infrastructure/database/orm/orm.module";
import { RoundRepository } from "@/infrastructure/database/orm/repository/round.repository";
import { EventListenerService } from "@/infrastructure/events/event-listener.service";
import { TimerService } from "@/infrastructure/events/timer.service";
import { ProxyModule } from "@/infrastructure/proxy/proxy.module";
import { ProxyService } from "@/infrastructure/proxy/proxy.service";
import { WebsocketGateway } from "@/infrastructure/websocket/websocket.gateway";
import { GamesController } from "@/presentation/controllers/games.controller";
import { GamesService } from "@/presentation/services/games.service";
import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
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
    ProxyModule
  ],
  controllers: [GamesController],
  providers: [
    ConfigService,
    GamesService,
    TimerService,
    EventListenerService,
    WebsocketGateway,
    RoundRepository,
    ProxyService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
