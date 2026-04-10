import { TransactionSource } from '@/domain/rabbitmq/rabbitmq.service';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@/infrastructure/database/orm/entites/transaction.entity';
import * as crypto from 'crypto';

export const genTransactionEntity = (props: Partial<Transaction>) => {
  const defaults = new Transaction({
    walletId: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    source: TransactionSource.BET_RESERVE,
    externalId: crypto.randomUUID(),
    type: TransactionType.DEBIT,
    amountInCents: 50000,
    balanceAfterInCents: 50000,
    status: TransactionStatus.COMPLETED,
    errorMessage: null,
  });

  return new Transaction({ ...defaults, ...props });
};
