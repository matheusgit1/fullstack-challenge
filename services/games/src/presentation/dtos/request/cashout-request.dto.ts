import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, Min } from "class-validator";
import { BetDto } from "../index";
import { RoundStatus } from "@/infrastructure/database/orm/entites/round.entity";

export class CashoutRequestDto {
  @ApiProperty({
    required: true,
    description: "ID da aposta cashout",
  })
  betId: string;

  @ApiProperty({ description: "ID da rodada" })
  roundId: string;
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

  @ApiProperty({
    description: "Status da rodada após o cashout",
    enum: RoundStatus,
    example: RoundStatus.BETTING,
  })
  roundStatus: RoundStatus;
}
