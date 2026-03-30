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
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", unique: true })
  userId: string;

  // Armazenar em centavos (BIGINT) para evitar problemas de ponto flutuante
  @Column({
    type: "bigint",
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  balanceInCents: number;

  // Versão para controle de concorrência otimista
  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper para converter centavos para reais
  getBalance(): number {
    return this.balanceInCents / 100;
  }

  // Helper para definir saldo a partir de reais
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
