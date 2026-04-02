import { ApiProperty } from "@nestjs/swagger";
import { BetDto } from "./bet.dto";
import { RoundStatus } from "@/infrastructure/database/orm/entites/round.entity";

export class CurrentRoundResponseDto {
  constructor(partial: CurrentRoundResponseDto) {
    Object.assign(this, partial);
  }
  @ApiProperty({ example: [BetDto], description: "Apostas da rodada atual" })
  bets: BetDto[];

  @ApiProperty({ example: "round_123456789" })
  id: string;

  @ApiProperty({ enum: RoundStatus, example: RoundStatus.BETTING })
  status: RoundStatus;

  @ApiProperty({ example: 1.0, description: "Multiplicador atual" })
  multiplier: number;

  @ApiProperty({ example: "2024-01-01T12:00:00Z", nullable: true })
  bettingEndsAt: Date | null;

  @ApiProperty({ example: "2024-01-01T12:00:00Z", nullable: true })
  startedAt: Date | null;

  @ApiProperty({
    example: "a3f5c8d2e1b4...",
    description: "Hash do seed para provably fair",
  })
  serverSeedHash: string;
}
