import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Round } from '@/infrastructure/database/orm/entites/round.entity';
import { Bet } from '@/infrastructure/database/orm/entites/bet.entity';
import { GameEngineModule } from './game-engine.module';
import { GameEngineService } from './game-engine.service';
import { GAME_ENGINE_SERVICE } from '@/domain/game/game.engine';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('GameEngineModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [GameEngineModule],
    })
      .overrideProvider(GameEngineService)
      .useValue({})
      .overrideProvider(GAME_ENGINE_SERVICE)
      .useValue({})
      .overrideProvider(EventEmitter2)
      .useValue({})
      .compile();

    expect(module).toBeDefined();
  });

  it('should provide repositories', async () => {
    const module = await Test.createTestingModule({
      imports: [GameEngineModule],
    }).compile();

    const roundRepo = module.get(getRepositoryToken(Round));
    const betRepo = module.get(getRepositoryToken(Bet));

    expect(roundRepo).toBeDefined();
    expect(betRepo).toBeDefined();
  });
});
