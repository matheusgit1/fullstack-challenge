import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsUUID } from 'class-validator';
import { BetDto } from '../response/bet.dto';

export class BetRequestDto {
  @ApiProperty({
    example: 100.0,
    description: 'Valor da aposta (mínimo R$ 1,00, máximo R$ 1.000,00) em centavos',
    minimum: 1 * 100, // 1 real em centavos
    maximum: 1000 * 100, // 1000 reais em centavos
  })
  @IsNumber()
  @Min(1 * 100)
  @Max(1000 * 100)
  amount: number;

  @ApiProperty({
    example: 'round_123456789',
    description: 'ID da rodada para a qual a aposta está sendo feita',
  })
  @IsUUID()
  roundId: string;
}

export class BetResponseDto {
  constructor(partial: BetResponseDto) {
    Object.assign(this, partial);
  }
  @ApiProperty()
  bet: BetDto;

  @ApiProperty({ description: 'Saldo atualizado após a aposta' })
  newBalance: number;

  @ApiProperty({ description: 'ID da rodada atual' })
  roundId: string;
}
