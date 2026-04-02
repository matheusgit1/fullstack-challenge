// services/wallets/src/infrastructure/database/repositories/wallet.repository.ts

import {
  Injectable,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Wallet } from "../entites/wallet.entity";
import {
  Transaction,
  TransactionSource,
} from "../entites/transaction.entity";

@Injectable()
export class WalletRepository {
  constructor(
    @InjectRepository(Wallet)
    private readonly repository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly dataSource: DataSource,
  ) {}

  async findByUserId(userId: string): Promise<Wallet | null> {
    return this.repository.findOne({
      where: { userId },
    });
  }

  async findById(id: string): Promise<Wallet | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findOrCreate(userId: string): Promise<Wallet> {
    let wallet = await this.findByUserId(userId);

    if (!wallet) {
      wallet = this.repository.create({
        userId,
        balanceInCents: 0,
      });
      wallet = await this.repository.save(wallet);
    }

    return wallet;
  }

  async createWallet(userId: string): Promise<Wallet> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      throw new ConflictException("Carteira já existe para este usuário");
    }

    const wallet = this.repository.create({
      userId,
      balanceInCents: 0,
    });

    return this.repository.save(wallet);
  }


  async getTransactionByExternalId(
    externalId: string,
    source: TransactionSource,
  ): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { externalId, source: source },
    });
  }
}
