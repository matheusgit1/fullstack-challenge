import { Test } from '@nestjs/testing';
import { ProvablyFairModule } from './provably-fair.module';
import { RoundRepository } from '@/infrastructure/database/orm/repository/round.repository';
import { BetRepository } from '@/infrastructure/database/orm/repository/bet.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Round } from '@/infrastructure/database/orm/entites/round.entity';
import { Bet } from '@/infrastructure/database/orm/entites/bet.entity';
import { ProvablyFairSeed } from '@/infrastructure/database/orm/entites/provably-fair.entity';

describe('ProvablyFairModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [ProvablyFairModule],
    })
      .overrideProvider(getRepositoryToken(Round))
      .useValue({})
      .overrideProvider(getRepositoryToken(Bet))
      .useValue({})
      .overrideProvider(getRepositoryToken(ProvablyFairSeed))
      .useValue({})
      .overrideProvider(RoundRepository)
      .useValue({})
      .overrideProvider(BetRepository)
      .useValue({})
      .overrideProvider(ProvablyFairSeed)
      .useValue({})
      .compile();

    expect(module).toBeDefined();
  });

  it('should resolve repositories', async () => {
    const module = await Test.createTestingModule({
      imports: [ProvablyFairModule],
    })
      .overrideProvider(getRepositoryToken(Round))
      .useValue({})
      .overrideProvider(getRepositoryToken(Bet))
      .useValue({})
      .overrideProvider(getRepositoryToken(ProvablyFairSeed))
      .useValue({})
      .compile();

    const roundRepo = module.get('RoundRepository');
    const betRepo = module.get('BetRepository');

    expect(roundRepo).toBeDefined();
    expect(betRepo).toBeDefined();
  });
});
