import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Bet } from './bet.entity';

export enum RoundStatus {
  BETTING = 'betting',
  RUNNING = 'running',
  CRASHED = 'crashed',
}

@Entity('rounds')
@Index(['status', 'createdAt'])
export class Round {
  constructor(partial?: Omit<Round, 'id' | 'createdAt' | 'updatedAt'>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RoundStatus,
    default: RoundStatus.BETTING,
  })
  status: RoundStatus;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 1.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  multiplier: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 1.5,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value ? parseFloat(value) : null),
    },
  })
  crashPoint: number;

  @Column({ type: 'timestamp' })
  bettingStartedAt: Date;

  @Column({ type: 'timestamp' })
  bettingEndsAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  crashedAt: Date;

  @Column({ type: 'varchar', length: 128, nullable: true })
  serverSeed: string | null;

  @Column({ type: 'varchar', length: 128 })
  serverSeedHash: string;

  @Column({ type: 'varchar', length: 64 })
  clientSeed: string;

  @Column({ type: 'int', default: 0 })
  nonce: number;

  @OneToMany('Bet', 'round', { cascade: true })
  bets: Bet[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt?: Date;

  isBettingPhase(): boolean {
    return this.status === RoundStatus.BETTING;
  }

  isRunning(): boolean {
    return this.status === RoundStatus.RUNNING;
  }

  isCrashed(): boolean {
    return this.status === RoundStatus.CRASHED;
  }

  canPlaceBet(): boolean {
    return this.isBettingPhase() && new Date() < this.bettingEndsAt;
  }

  canCashout(): boolean {
    return this.isRunning();
  }

  getBettingDurationMs(): number {
    return this.bettingEndsAt.getTime() - this.bettingStartedAt.getTime();
  }

  getRemainingBettingTimeMs(): number {
    return Math.max(0, this.bettingEndsAt.getTime() - Date.now());
  }

  setStatus(status: RoundStatus) {
    if (status === RoundStatus.CRASHED) {
      this.endedAt = new Date();
    }

    if (status === RoundStatus.RUNNING) {
      this.bettingEndsAt = new Date();
      this.startedAt = new Date();
    }

    if (status === RoundStatus.BETTING) {
      this.bettingStartedAt = new Date();
    }
    this.status = status;
  }

  setMultiplier(multiplier: number) {
    this.multiplier = multiplier;
  }
}
