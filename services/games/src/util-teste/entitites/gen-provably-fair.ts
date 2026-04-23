import { ProvablyFairSeed } from '@/infrastructure/database/orm/entites/provably-fair.entity';

export const genProvablyFair = (partial?: Partial<ProvablyFairSeed>) => {
  const defaults = new ProvablyFairSeed({
    clientSeed: 'clientSeed',
    serverSeed: 'serverSeed',
    serverSeedHash: 'serverSeedHash',
    nonce: 0,
    isUsed: true,
    usedAt: new Date(),
    createdAt: new Date(),
  });

  return new ProvablyFairSeed({ ...defaults, ...partial });
};
