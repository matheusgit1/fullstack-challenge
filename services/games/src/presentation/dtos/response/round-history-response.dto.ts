import { ApiProperty } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';
import { IsNumber, IsPositive, IsUUID } from 'class-validator';
import { BetDto } from './bet.dto';

export class RoundHistoryItemDto {
  /*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Constructor for RoundHistoryItemDto
   * @param {Partial<RoundHistoryItemDto>} partial - Partial RoundHistoryItemDto object
   */
  /*******  c2b0590d-85d1-4478-9864-cdc10a8d85d3  *******/
  constructor(partial: Partial<RoundHistoryItemDto>) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: 'round_1734567890123' })
  roundId: string;

  @ApiProperty({ example: 5.23, description: 'Ponto de crash' })
  crashPoint: number | string;

  @ApiProperty({ example: RoundStatus.CRASHED, description: 'Status da rodada', examples: Object.values(RoundStatus) })
  status: RoundStatus;

  @ApiProperty({ example: 'a3f5c8d2e1b4...', description: 'Hash do seed' })
  serverSeedHash: string;

  @ApiProperty({ example: '2024-01-01T12:00:15Z' })
  endedAt: string | Date;

  @ApiProperty({ example: 15, description: 'Número total de apostas' })
  totalBets: number;

  @ApiProperty({ example: 1250.0, description: 'Valor total apostado' })
  totalAmount: number;

  @ApiPropertyOptional({ example: 2.5, description: 'Multiplicador da rodada' })
  multiplier?: number;

  @ApiPropertyOptional({ example: '2024-01-01T12:00:00Z', description: 'Início das apostas' })
  bettingStartedAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-01T12:00:10Z', description: 'Fim das apostas' })
  bettingEndsAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-01T12:00:12Z', description: 'Início da rodada' })
  roundStartedAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-01T12:00:15Z', description: 'Momento do crash' })
  roundCrashedAt?: string | Date;

  @ApiPropertyOptional({ example: 'a3f5c8d2e1b4c5d6e7f8g9h0i1j2k3l4', description: 'Seed do servidor' })
  serverSeed?: string | undefined | null;

  @ApiPropertyOptional({ example: 'client_seed_123', description: 'Seed do cliente' })
  clientSeed?: string;

  @ApiPropertyOptional({ example: 42, description: 'Nonce da rodada' })
  nonce?: number;

  @ApiPropertyOptional({ example: '2024-01-01T12:00:00Z', description: 'Data de criação' })
  createdAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-01T12:00:15Z', description: 'Data de atualização' })
  updatedAt?: Date;

  @ApiPropertyOptional({ type: [BetDto], description: 'Apostaas da rodada' })
  bets: BetDto[];
}
