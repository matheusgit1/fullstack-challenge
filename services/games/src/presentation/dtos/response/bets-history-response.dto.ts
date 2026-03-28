// services/games/src/presentation/dtos/bets-history-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BetDto } from "../index";
import { BetStatus } from "../enums/enums";

export class BetsHistoryQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ["pending", "cashed_out", "lost"] })
  status?: BetStatus;
}

export class BetHistoryItemDto extends BetDto {
  @ApiProperty({ description: "ID da rodada" })
  roundId: string;

  @ApiProperty({ description: "Ponto de crash da rodada", nullable: true })
  roundCrashPoint: number | null;
}
