import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('provably_fair_seeds')
@Index(['createdAt'])
export class ProvablyFairSeed {
  constructor(partial?: Omit<ProvablyFairSeed, 'id'>) {
    Object.assign(this, partial);
  }
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 128 })
  clientSeed: string;

  @Column({ type: 'varchar', length: 128 })
  serverSeed: string;

  @Column({ type: 'varchar', length: 128 })
  serverSeedHash: string;

  @Column({ type: 'int', default: 0 })
  nonce: number;

  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
