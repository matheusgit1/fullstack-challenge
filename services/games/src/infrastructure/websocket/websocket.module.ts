import { Module } from "@nestjs/common";
import { AppWebSocketGateway } from "./websocket.gateway";
import { WebSocketService } from "./websocket.service";
import { BetEventHandler } from "./handlers/bet-event.handler";
import { OrmModule } from "@/infrastructure/database/orm/orm.module";
import { RabbitmqModule } from "../rabbitmq/rabbitmq.module";

@Module({
  imports: [OrmModule, RabbitmqModule],
  providers: [
    AppWebSocketGateway,
    WebSocketService,
    BetEventHandler,
  ],
  exports: [WebSocketService, AppWebSocketGateway],
})
export class WebsocketModule {}
