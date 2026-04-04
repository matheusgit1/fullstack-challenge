import { Module } from '@nestjs/common';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';
import { BetEventHandler } from './handlers/bet-event.handler';
import { AppWebSocketGateway } from './app-websocket.gateway';
import { WebSocketService } from './websocket.service';
import { OrmModule } from '@/infrastructure/database/orm/orm.module';
import { WEB_SOCKET_SERVICE } from '@/domain/websocket/websocket.service';

@Module({
  imports: [OrmModule, RabbitmqModule],
  providers: [
    AppWebSocketGateway,
    {
      provide: WEB_SOCKET_SERVICE,
      useClass: WebSocketService,
    },
    BetEventHandler,
  ],
  exports: [WEB_SOCKET_SERVICE, AppWebSocketGateway],
})
export class WebsocketModule {}
