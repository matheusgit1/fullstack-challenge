import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BetDto } from "./bet.dto";
import { BetStatus } from "@/infrastructure/database/orm/entites/bet.entity";


export class BetHistoryItemDto extends BetDto {
  constructor(partial: BetHistoryItemDto) {
    super(partial);
  }
  @ApiProperty({ description: "ID da rodada" })
  roundId: string;

  @ApiProperty({ description: "Ponto de crash da rodada", nullable: true })
  roundCrashPoint: number | null;
}
