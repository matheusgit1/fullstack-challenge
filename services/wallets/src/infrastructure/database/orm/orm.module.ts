import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DBClientConfig } from "../orm.client";
import { Transaction } from "./entites/transaction.entity";
import { Wallet } from "./entites/wallet.entity";
import { WalletRepository } from "./repository/wallet.repository";

@Module({
  imports: [
    ConfigModule.forRoot({}),
    TypeOrmModule.forRootAsync(DBClientConfig),
    TypeOrmModule.forFeature([Transaction, Wallet]),
  ],
  providers: [WalletRepository],
  exports: [TypeOrmModule, WalletRepository],
})
export class OrmModule {}
