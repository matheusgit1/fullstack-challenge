

import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsNumber, Min } from "class-validator";
import { BetDto } from "../index";
import { RoundStatus } from "../enums/enums";

export class CashoutRequestDto {
  @ApiProperty({
    required: false,
    description: "Auto cashout: define multiplicador alvo (opcional)",
    example: 2.5,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  targetMultiplier?: number;
}

export class CashoutResponseDto {
  constructor(partial: CashoutResponseDto) {
    Object.assign(this, partial);
  }
  @ApiProperty()
  bet: BetDto;

  @ApiProperty({ description: "Multiplicador no momento do cashout" })
  multiplier: number;

  @ApiProperty({ description: "Valor ganho" })
  winAmount: number;

  @ApiProperty({ description: "Saldo atualizado após o cashout" })
  newBalance: number;

  @ApiProperty({ description: "Status da rodada após o cashout", enum: RoundStatus, example: RoundStatus.BETTING })
  roundStatus: RoundStatus;
}
