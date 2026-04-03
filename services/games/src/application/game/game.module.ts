import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GameEngineModule } from "./game-engine/game-engine.module";
import { ProvablyFairModule } from "./provably-fair/provably-fair.module";import { Bet } from "@/infrastructure/database/orm/entites/bet.entity";
import { Round } from "@/infrastructure/database/orm/entites/round.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Round, Bet]),
    GameEngineModule,
    ProvablyFairModule,
  ],
  exports: [TypeOrmModule, GameEngineModule, ProvablyFairModule],
})
export class GameModule {}
