import { Module } from "@nestjs/common";
import { TimerService } from "./timer.service";
import { OrmModule } from "@/infrastructure/database/orm/orm.module";
import { EventEmitter2, EventEmitterModule } from "@nestjs/event-emitter";
import { GameEngineModule } from "@/application/services/game-engine/game-engine.module";
import { ProvablyFairModule } from "@/application/services/provably-fair/provably-fair.module";
import { WebsocketModule } from "@/infrastructure/websocket/websocket.module";

@Module({
  imports: [OrmModule, GameEngineModule, ProvablyFairModule, WebsocketModule],
  providers: [TimerService],
  exports: [TimerService],
})
export class TimerModule {}
