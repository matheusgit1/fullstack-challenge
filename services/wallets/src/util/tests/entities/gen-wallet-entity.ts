import { Wallet } from '@/infrastructure/database/orm/entites/wallet.entity';
import * as crypto from 'crypto';

export const genWalletEntity = (props?: Partial<Wallet>) => {
  const defaults = new Wallet({
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    balanceInCents: 50000,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    getBalance: Wallet.prototype.getBalance,
    setBalance: Wallet.prototype.setBalance,
    canDebit: Wallet.prototype.canDebit,
    debit: Wallet.prototype.debit,
    credit: Wallet.prototype.credit,
  });

  return new Wallet({ ...defaults, ...props } as Wallet);
};
