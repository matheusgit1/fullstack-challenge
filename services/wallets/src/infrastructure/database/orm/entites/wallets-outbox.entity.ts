import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum OutboxStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Entity('wallets_outbox_messages')
@Index(['status', 'createdAt'])
export class WalletsOutboxMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  eventType: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'varchar', length: 50, default: OutboxStatus.PENDING })
  status: OutboxStatus;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;
}