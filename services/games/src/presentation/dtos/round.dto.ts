// services/games/src/presentation/dtos/round.dto.ts

import { ApiProperty } from "@nestjs/swagger";
import { BetStatus, RoundStatus } from "./enums/enums";

export class BetDto {
  constructor(partial: BetDto) {
    Object.assign(this, partial);
  }
  @ApiProperty({ example: "bet_123456789" })
  id: string;

  @ApiProperty({ example: "user_123" })
  userId: string;

  @ApiProperty({ example: "PlayerTest" })
  username: string;

  @ApiProperty({ example: 100.0, description: "Valor da aposta em reais" })
  amount: number;

  @ApiProperty({
    example: 2.5,
    nullable: true,
    description: "Multiplicador no momento do cashout",
  })
  multiplier: number | null;

  @ApiProperty({ enum: BetStatus, example: BetStatus.PENDING })
  status: BetStatus;

  @ApiProperty({ example: "2024-01-01T12:00:00Z", nullable: true })
  cashedOutAt: Date | null;

  @ApiProperty({ example: "2024-01-01T12:00:00Z" })
  createdAt: Date;
}

export class RoundDto {
  public constructor(partial: RoundDto) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: "round_123456789" })
  id: string;

  @ApiProperty({ enum: RoundStatus, example: RoundStatus.BETTING })
  status: RoundStatus;

  @ApiProperty({ example: 1.0, description: "Multiplicador atual" })
  multiplier: number;

  @ApiProperty({
    example: 5.23,
    nullable: true,
    description: "Ponto onde crashou",
  })
  crashPoint: number | null;

  @ApiProperty({ example: "2024-01-01T12:00:00Z", nullable: true })
  bettingEndsAt: Date | null;

  @ApiProperty({ example: "2024-01-01T12:00:00Z", nullable: true })
  startedAt: Date | null;

  @ApiProperty({ example: "2024-01-01T12:00:00Z", nullable: true })
  crashedAt: Date | null;

  @ApiProperty({
    example: "a3f5c8d2e1b4...",
    description: "Hash do seed para provably fair",
  })
  serverSeedHash: string;

  @ApiProperty({ type: [BetDto], description: "Apostas da rodada atual" })
  bets: BetDto[];
}

export class PaginatedResponseDto<T> {
  public constructor(partial: PaginatedResponseDto<T>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  data: T[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}
