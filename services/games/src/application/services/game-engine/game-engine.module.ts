import { Module } from "@nestjs/common";
import { GameEngineService } from "./game-engine.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ProvablyFairModule } from "../provably-fair/provably-fair.module";
import { OrmModule } from "@/infrastructure/database/orm/orm.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ProvablyFairModule, OrmModule, ConfigModule],
  providers: [GameEngineService, EventEmitter2],
  exports: [GameEngineService],
})
export class GameEngineModule {}
