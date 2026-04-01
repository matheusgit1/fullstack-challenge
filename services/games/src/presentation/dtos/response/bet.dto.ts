import { BetStatus } from "@/infrastructure/database/orm/entites/bet.entity";
import { ApiProperty } from "@nestjs/swagger";

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