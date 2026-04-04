import { ApiProperty } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';
import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class RoundHistoryItemDto {
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
  endedAt: Date;

  @ApiProperty({ example: 15, description: 'Número total de apostas' })
  totalBets: number;

  @ApiProperty({ example: 1250.0, description: 'Valor total apostado' })
  totalAmount: number;
}


