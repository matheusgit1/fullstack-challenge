import { Module } from "@nestjs/common";
import { GameEngineService } from "./game-engine.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ProvablyFairModule } from "../provably-fair/provably-fair.module";
import { OrmModule } from "@/infrastructure/database/orm/orm.module";
import { ConfigModule } from "@nestjs/config";
import { GAME_ENGINE_SERVICE } from "@/domain/game/game.engine";

@Module({
  imports: [ProvablyFairModule, OrmModule, ConfigModule],
  providers: [
    GameEngineService,
    {
      provide: GAME_ENGINE_SERVICE,
      useClass: GameEngineService,
    },
    EventEmitter2,
  ],
  exports: [GameEngineService, GAME_ENGINE_SERVICE],
})
export class GameEngineModule {}
