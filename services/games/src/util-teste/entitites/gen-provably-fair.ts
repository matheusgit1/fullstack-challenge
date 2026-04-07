import { ProvablyFairSeed } from '@/infrastructure/database/orm/entites/provably-fair.entity';

export const genProvablyFair = (partial?: Partial<ProvablyFairSeed>) => {
  return new ProvablyFairSeed({
    id: 'id',
    clientSeed: 'clientSeed',
    serverSeed: 'serverSeed',
    serverSeedHash: 'serverSeedHash',
    nonce: 0,
    isUsed: true,
    usedAt: new Date(),
    createdAt: new Date(),
    ...partial,
  });
};
