import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProvablyFairModule } from '../provably-fair/provably-fair.module';
import { GameEngineService } from './game-engine.service';
import { GAME_ENGINE_SERVICE } from '@/domain/game/game.engine';
import { OrmModule } from '@/infrastructure/database/orm/orm.module';
import { EventModule } from '@/application/events/event/event.module';

@Module({
  imports: [ProvablyFairModule, OrmModule, ConfigModule, EventModule],
  providers: [
    {
      provide: GAME_ENGINE_SERVICE,
      useClass: GameEngineService,
    },
    EventEmitter2,
  ],
  exports: [GAME_ENGINE_SERVICE],
})
export class GameEngineModule {}
