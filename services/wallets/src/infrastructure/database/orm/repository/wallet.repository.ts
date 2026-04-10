import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../entites/wallet.entity';
import { type IWalletRepository } from '@/domain/orm/repositories/wallet.repository';
import { Transaction, TransactionSource } from '../entites/transaction.entity';
import { type ITransactionRepository, TRANSACTION_REPOSITORY } from '@/domain/orm/repositories/transaction.repository';

@Injectable()
export class WalletRepository implements IWalletRepository {
  constructor(
    @InjectRepository(Wallet)
    private readonly repository: Repository<Wallet>,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
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
      });
      wallet = await this.repository.save(wallet);
    }

    return wallet;
  }

  async createWallet(userId: string): Promise<Wallet> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      throw new ConflictException('Carteira já existe para este usuário');
    }

    const wallet = this.repository.create({
      userId,
    });

    return this.repository.save(wallet);
  }

  async getTransactionByExternalId(externalId: string, source: TransactionSource): Promise<Transaction | null> {
    return await this.transactionRepository.findByExternalIdAndSource(externalId, source);
  }
}
