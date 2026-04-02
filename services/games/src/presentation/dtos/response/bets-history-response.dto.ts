import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BetStatus } from "@/infrastructure/database/orm/entites/bet.entity";
import { BetDto } from "./bet.dto";

export class BetsHistoryQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ["pending", "cashed_out", "lost"] })
  status?: BetStatus;
}

export class BetHistoryItemDto extends BetDto {
  constructor(partial: BetHistoryItemDto) {
    super(partial);
  }
  @ApiProperty({ description: "ID da rodada" })
  roundId: string;

  @ApiProperty({ description: "Ponto de crash da rodada", nullable: true })
  roundCrashPoint: number | null;
}
