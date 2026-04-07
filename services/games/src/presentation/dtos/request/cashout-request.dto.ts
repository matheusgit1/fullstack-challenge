import { ApiProperty } from '@nestjs/swagger';
import { BetDto } from '../response/bet.dto';
import { RoundStatus } from '@/infrastructure/database/orm/entites/round.entity';
import { IsUUID } from 'class-validator';

export class CashoutRequestDto {
  constructor(partial: CashoutRequestDto) {
    Object.assign(this, partial);
  }
  @ApiProperty({
    required: true,
    description: 'ID da aposta cashout',
  })
  @IsUUID()
  betId: string;
}

export class CashoutResponseDto {
  constructor(partial: CashoutResponseDto) {
    Object.assign(this, partial);
  }
  @ApiProperty()
  bet: BetDto;

  @ApiProperty({ description: 'Multiplicador no momento do cashout' })
  multiplier: number;

  @ApiProperty({ description: 'Valor ganho' })
  winAmount: number;

  @ApiProperty({
    description: 'Status da rodada após o cashout',
    enum: RoundStatus,
    example: RoundStatus.BETTING,
  })
  roundStatus: RoundStatus;
}
