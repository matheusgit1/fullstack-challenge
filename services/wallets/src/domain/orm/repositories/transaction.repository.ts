import {
  Transaction,
  TransactionSource,
  TransactionType,
} from '@/infrastructure/database/orm/entites/transaction.entity';

export interface ITransactionRepository {
  findByExternalIdAndSource(externalId: string, source: TransactionSource): Promise<Transaction | null>;

  processTransaction(
    userId: string,
    amountInCents: number,
    type: TransactionType,
    source: TransactionSource,
    externalId: string,
    metadata?: Record<string, any>,
  ): Promise<void>;
}

export const TRANSACTION_REPOSITORY = Symbol('ITransactionRepository');
