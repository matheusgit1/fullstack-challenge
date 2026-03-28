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
  BET_CASHED_OUT = "bet_cashed_out",
  BET_LOST = "bet_lost",
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  BONUS = "bonus",
}

@Entity("transactions")
@Index(["walletId", "createdAt"])
@Index(["externalId", "source"], { unique: true }) // Garantir idempotência
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

  @Column({ type: "bigint" })
  amountInCents: number;

  @Column({ type: "bigint" })
  balanceAfterInCents: number;

  @Column({
    type: "enum",
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status: TransactionStatus;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any>;

  @Column({ type: "text", nullable: true })
  errorMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
