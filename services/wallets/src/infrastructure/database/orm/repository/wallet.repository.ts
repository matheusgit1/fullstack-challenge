// services/wallets/src/infrastructure/database/repositories/wallet.repository.ts

import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Wallet } from "../entites/wallet.entity";
import {
  Transaction,
  TransactionSource,
  TransactionStatus,
  TransactionType,
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

  async processTransaction(
    walletId: string,
    userId: string,
    amountInCents: number,
    type: TransactionType,
    source: TransactionSource,
    externalId: string,
    metadata?: Record<string, any>,
  ): Promise<{ wallet: Wallet; transaction: Transaction }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager
        .createQueryBuilder(Wallet, "wallet")
        .setLock("pessimistic_write")
        .where("wallet.id = :id", { id: walletId })
        .getOne();

      if (!wallet) {
        throw new NotFoundException("Carteira não encontrada");
      }

      let newBalanceInCents: number;

      if (type === TransactionType.CREDIT) {
        wallet.credit(amountInCents);
        newBalanceInCents = wallet.balanceInCents;
      } else {
        if (!wallet.canDebit(amountInCents)) {
          throw new Error("Saldo insuficiente");
        }
        wallet.debit(amountInCents);
        newBalanceInCents = wallet.balanceInCents;
      }
      await queryRunner.manager.save(wallet);

      const transaction = new Transaction({
        walletId: wallet.id,
        userId,
        source,
        externalId,
        type,
        amountInCents,
        balanceAfterInCents: newBalanceInCents,
        status: TransactionStatus.COMPLETED,
        metadata,
      });

      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      return { wallet, transaction };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<[Transaction[], number]> {
    const skip = (page - 1) * limit;

    return this.transactionRepository.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      skip,
      take: limit,
    });
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
