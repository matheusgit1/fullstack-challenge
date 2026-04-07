import { Logger } from '@nestjs/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction, TransactionSource, TransactionStatus, TransactionType } from '../entites/transaction.entity';
import { DataSource, Repository } from 'typeorm';
import { Wallet } from '../entites/wallet.entity';
import { type ITransactionRepository } from '@/domain/orm/repositories/transaction.repository';

@Injectable()
export class TransactionRepository implements ITransactionRepository {
  private readonly Logger = new Logger(TransactionRepository.name);
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly dataSource: DataSource,
  ) {}

  async findByExternalIdAndSource(externalId: string, source: TransactionSource): Promise<Transaction | null> {
    return await this.transactionRepository.findOne({
      where: { externalId, source },
    });
  }

  async processTransaction(
    userId: string,
    amountInCents: number,
    type: TransactionType,
    source: TransactionSource,
    externalId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    this.Logger.debug(
      `processing message: ${JSON.stringify({ userId, amountInCents, type, source, externalId, metadata })}`,
    );
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager
        .createQueryBuilder(Wallet, 'wallet')
        .setLock('pessimistic_write')
        .where('wallet.userId = :userId', { userId: userId })
        .getOne();

      if (!wallet) {
        throw new NotFoundException('Carteira não encontrada');
      }

      if (source === TransactionSource.BET_RESERVE) {
        wallet.debit(amountInCents);
        const transaction = new Transaction({
          walletId: wallet.id,
          userId,
          source,
          externalId,
          type,
          amountInCents,
          balanceAfterInCents: wallet.balanceInCents < 0 ? 0 : wallet.balanceInCents,
          status: TransactionStatus.PENDING,
          metadata,
        });
        await queryRunner.manager.save(transaction);
      }

      if (source === TransactionSource.BET_LOST) {
        await queryRunner.manager.update(
          Transaction,
          {
            externalId,
            status: TransactionStatus.PENDING,
            source: TransactionSource.BET_RESERVE,
          },
          {
            status: TransactionStatus.COMPLETED,
            source: TransactionSource.BET_LOST,
          },
        );
      }

      if (source === TransactionSource.BET_PLACED) {
        wallet.credit(amountInCents);
        await queryRunner.manager.update(
          Transaction,
          {
            externalId,
            status: TransactionStatus.PENDING,
            source: TransactionSource.BET_RESERVE,
          },
          {
            status: TransactionStatus.COMPLETED,
            source: TransactionSource.BET_PLACED,
          },
        );
      }

      await queryRunner.manager.save(wallet);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
