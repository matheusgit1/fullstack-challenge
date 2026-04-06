import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  VersionColumn,
} from "typeorm";

@Entity("wallets")
@Index(["userId"], { unique: true })
export class Wallet {
  constructor(partial: Partial<Wallet>) {
    Object.assign(this, partial);
  }
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", unique: true })
  userId: string;

  @Column({
    type: "bigint",
    default: 0,
    comment: "Saldo em centavos",
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  balanceInCents: number;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  getBalance(): number {
    return this.balanceInCents / 100;
  }

  setBalance(amount: number): void {
    this.balanceInCents = Math.round(amount * 100);
  }

  canDebit(amountInCents: number): boolean {
    return this.balanceInCents >= amountInCents;
  }

  debit(amountInCents: number): void {
    if (!this.canDebit(amountInCents)) {
      throw new Error("Saldo insuficiente");
    }

    this.balanceInCents -= amountInCents;
  }

  credit(amountInCents: number): void {
    if (amountInCents < 0) {
      throw new Error("Valor de crédito deve ser positivo");
    }
    this.balanceInCents += amountInCents;
  }
}
