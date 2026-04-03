import { Module } from "@nestjs/common";
import { RabbitmqModule } from "../rabbitmq/rabbitmq.module";
import { BetEventHandler } from "./handlers/bet-event.handler";
import { AppWebSocketGateway } from "./websocket.gateway";
import { WebSocketService } from "./websocket.service";
import { OrmModule } from "@/infrastructure/database/orm/orm.module";


@Module({
  imports: [OrmModule, RabbitmqModule],
  providers: [AppWebSocketGateway, WebSocketService, BetEventHandler],
  exports: [WebSocketService, AppWebSocketGateway],
})
export class WebsocketModule {}
