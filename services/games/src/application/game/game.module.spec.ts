import { Test } from '@nestjs/testing';
import { GameModule } from './game.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Round } from '@/infrastructure/database/orm/entites/round.entity';
import { Bet } from '@/infrastructure/database/orm/entites/bet.entity';

describe('GameModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [GameModule],
    })
      .overrideProvider(getRepositoryToken(Round))
      .useValue({})
      .overrideProvider(getRepositoryToken(Bet))
      .useValue({})
      .compile();

    expect(module).toBeDefined();
  });

  it('should provide repositories', async () => {
    const module = await Test.createTestingModule({
      imports: [GameModule],
    }).compile();

    const roundRepo = module.get(getRepositoryToken(Round));
    const betRepo = module.get(getRepositoryToken(Bet));

    expect(roundRepo).toBeDefined();
    expect(betRepo).toBeDefined();
  });
});
