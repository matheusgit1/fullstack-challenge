

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Round } from './round.entity';

export enum BetStatus {
  PENDING = 'pending',
  CASHED_OUT = 'cashed_out',
  LOST = 'lost',
}

@Entity('bets')
@Index(['roundId', 'userId'], { unique: true }) // Uma aposta por usuário por rodada
@Index(['userId', 'createdAt'])
@Index(['roundId', 'status'])
export class Bet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  roundId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => value ? parseFloat(value) : null,
    },
  })
  multiplier: number | null;

  @Column({
    type: 'enum',
    enum: BetStatus,
    default: BetStatus.PENDING,
  })
  status: BetStatus;

  @Column({ type: 'timestamp', nullable: true })
  cashedOutAt: Date | null;

  // Relacionamentos
  @ManyToOne(() => Round, (round) => round.bets)
  @JoinColumn({ name: 'roundId' })
  round: Round;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos auxiliares
  isPending(): boolean {
    return this.status === BetStatus.PENDING;
  }

  isCashedOut(): boolean {
    return this.status === BetStatus.CASHED_OUT;
  }

  isLost(): boolean {
    return this.status === BetStatus.LOST;
  }

  cashout(multiplier: number): void {
    if (!this.isPending()) {
      throw new Error('Apenas apostas pendentes podem ser sacadas');
    }
    this.status = BetStatus.CASHED_OUT;
    this.multiplier = multiplier;
    this.cashedOutAt = new Date();
  }

  lose(): void {
    if (!this.isPending()) {
      throw new Error('Apenas apostas pendentes podem ser perdidas');
    }
    this.status = BetStatus.LOST;
  }

  getWinAmount(): number {
    if (!this.isCashedOut() || !this.multiplier) {
      return 0;
    }
    return this.amount * this.multiplier;
  }
}