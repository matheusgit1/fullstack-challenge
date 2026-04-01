import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from "typeorm";

export enum TransactionType {
  CREDIT = "credit",
  DEBIT = "debit",
}

export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum TransactionSource {
  BET_PLACED = "bet_placed",
  BET_LOST = "bet_lost",
  BET_RESERVE = "bet_reserve",
}

@Entity("transactions")
@Index(["walletId", "createdAt"])
@Index(["externalId", "source"], { unique: true }) // Garantir que não haja transações duplicadas para a mesma fonte (importante para idempotência)
export class Transaction {
  constructor(partial: Partial<Transaction>) {
    Object.assign(this, partial);
  }
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  walletId: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "varchar", length: 50 })
  source: TransactionSource;

  @Column({ type: "varchar", length: 100, nullable: true })
  externalId: string; // ID da aposta, rodada, etc

  @Column({ type: "enum", enum: TransactionType })
  type: TransactionType;

  @Column({
    type: "bigint",
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  amountInCents: number;

  @Column({
    type: "bigint",
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  balanceAfterInCents: number;

  @Column({
    type: "enum",
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status: TransactionStatus;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: "text", nullable: true })
  errorMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
