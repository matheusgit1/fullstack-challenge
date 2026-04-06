import { EventModule } from '@/application/events/event/event.module';
import { GameEngineModule } from '@/application/game/game-engine/game-engine.module';
import { ProvablyFairModule } from '@/application/game/provably-fair/provably-fair.module';
import { OrmModule } from '@/infrastructure/database/orm/orm.module';
import { WebsocketModule } from '@/infrastructure/websocket/websocket.module';
import { Test } from '@nestjs/testing';

describe('EventModule', () => {
  it('should be defined', () => {
    const module = Test.createTestingModule({
      imports: [EventModule],
    })

      .compile();

    expect(module).toBeDefined();
  });
});
