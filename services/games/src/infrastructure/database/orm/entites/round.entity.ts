import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";

export enum RoundStatus {
  BETTING = "betting",
  RUNNING = "running",
  CRASHED = "crashed",
}

@Entity("rounds")
@Index(["status", "createdAt"])
export class Round {
  constructor(partial: Partial<Round>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: RoundStatus,
    default: RoundStatus.BETTING,
  })
  status: RoundStatus;

  @Column({
    type: "decimal",
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
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: false,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value ? parseFloat(value) : null),
    },
  })
  crashPoint: number;

  @Column({ type: "timestamp" })
  bettingStartedAt: Date;

  @Column({ type: "timestamp" })
  bettingEndsAt: Date;

  @Column({ type: "timestamp", nullable: true })
  startedAt: Date;

  @Column({ type: "timestamp", nullable: true })
  crashedAt: Date;

  @Column({ type: "varchar", length: 128, nullable: true })
  serverSeed: string | null;

  @Column({ type: "varchar", length: 128 })
  serverSeedHash: string;

  @Column({ type: "varchar", length: 64 })
  clientSeed: string;

  @Column({ type: "int", default: 0 })
  nonce: number;

  @OneToMany("Bet", "round", { cascade: true })
  bets: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

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
    this.status = status;
  }

  setMultiplier(multiplier: number) {
    this.multiplier = multiplier;
  }
}
