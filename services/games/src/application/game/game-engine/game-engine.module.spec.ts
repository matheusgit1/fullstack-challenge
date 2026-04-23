import { Test } from '@nestjs/testing';
import { GameEngineModule } from './game-engine.module';
import { GameEngineService } from './game-engine.service';
import { GAME_ENGINE_SERVICE } from '@/domain/game/game.engine';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrmModule } from '@/infrastructure/database/orm/orm.module';
import { ProvablyFairModule } from '../provably-fair/provably-fair.module';

describe('GameEngineModule', () => {
  let moduleRef;
  it('should compile the module', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [GameEngineModule],
    })
      .overrideModule(ProvablyFairModule)
      .useModule(class {})
      .overrideModule(OrmModule)
      .useModule(class {})
      .overrideProvider(GameEngineService)
      .useValue({})
      .overrideProvider(GAME_ENGINE_SERVICE)
      .useValue({})
      .overrideProvider(EventEmitter2)
      .useValue({})
      .compile();

    expect(moduleRef).toBeDefined();
  });
});
