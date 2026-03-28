// services/games/src/presentation/dtos/bet-request.dto.ts

import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, Min, Max } from "class-validator";
import { BetDto } from "../index";

export class BetRequestDto {
  @ApiProperty({
    example: 100.0,
    description: "Valor da aposta (mínimo R$ 1,00, máximo R$ 1.000,00)",
    minimum: 1,
    maximum: 1000,
  })
  @IsNumber()
  @Min(1)
  @Max(1000)
  amount: number;
}

export class BetResponseDto {
  constructor(partial: BetResponseDto) {
    Object.assign(this, partial);
  }
  @ApiProperty()
  bet: BetDto;

  @ApiProperty({ description: "Saldo atualizado após a aposta" })
  newBalance: number;

  @ApiProperty({ description: "ID da rodada atual" })
  roundId: string;
}
