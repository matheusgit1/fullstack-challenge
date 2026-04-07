import { UserWallet } from '@/domain/proxy/wallet.proxy';

export const genWallet = (partial: Partial<UserWallet>) => {
  return {
    success: true,
    data: {
      id: 'c636a0d6-dff4-4203-819e-0ea074b934b8',
      userId: '328b5bea-d4f9-4a58-a504-5a12c2be5220',
      balance: 1000,
      balanceInCents: 100000,
      createdAt: '2026-04-02T04:08:58.374Z',
      updatedAt: '2026-04-07T04:54:24.784Z',
      ...partial,
    },
    tracingId: '5707ea08958f396350',
    timestamp: '2026-04-07T04:54:29.388Z',
  };
};
