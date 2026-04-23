import { Sucess, UserWallet } from '@/domain/proxy/wallet.proxy';
import * as crypto from 'crypto';

export const genWallet = (partial: Partial<UserWallet>): Sucess<UserWallet> => {
  return {
    success: true,
    data: {
      id: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      balance: 5000,
      balanceInCents: 100 * 5000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...partial,
    },
    tracingId: '5707ea08958f396350',
    timestamp: '2026-04-07T04:54:29.388Z',
  };
};
