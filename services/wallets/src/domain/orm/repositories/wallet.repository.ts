import {
  Transaction,
  TransactionSource,
} from "@/infrastructure/database/orm/entites/transaction.entity";
import { Wallet } from "@/infrastructure/database/orm/entites/wallet.entity";

export interface IWalletRepository {
  findByUserId(userId: string): Promise<Wallet | null>;
  findById(id: string): Promise<Wallet | null>;
  findOrCreate(userId: string): Promise<Wallet>;
  createWallet(userId: string): Promise<Wallet>;
  getTransactionByExternalId(
    externalId: string,
    source: TransactionSource,
  ): Promise<Transaction | null>;
}

export const WALLET_REPOSITORY = Symbol("IWalletRepository");
