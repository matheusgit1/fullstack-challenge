import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WALLET_REPOSITORY } from "@/domain/orm/repositories/wallet.repository";
import { WalletRepository } from "./repository/wallet.repository";
import { Wallet } from "./entites/wallet.entity";
import { TransactionRepository } from "./repository/transaction.repository";
import { TRANSACTION_REPOSITORY } from "@/domain/orm/repositories/transaction.repository";
import { Transaction } from "./entites/transaction.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Wallet])],
  providers: [
    {
      provide: WALLET_REPOSITORY,
      useClass: WalletRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useValue: TransactionRepository,
    },
  ],
  exports: [TypeOrmModule, WALLET_REPOSITORY, TRANSACTION_REPOSITORY],
})
export class OrmRepositoryModule {}
