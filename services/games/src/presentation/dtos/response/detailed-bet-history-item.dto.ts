import { ApiProperty } from '@nestjs/swagger';
import { BetHistoryItemDto } from './bets-history-response.dto';

export class DetailedBetHistoryItemDto {
  constructor(partial: DetailedBetHistoryItemDto) {
    Object.assign(this, partial);
  }
  @ApiProperty()
  bets: BetHistoryItemDto[];

  @ApiProperty()
  totalBetsAmount: number;

  @ApiProperty()
  totalProfit: number;

  @ApiProperty()
  successRate: number;
}
