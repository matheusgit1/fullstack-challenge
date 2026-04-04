import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class RoundHistoryQueryDto {
  constructor(partial: Partial<RoundHistoryQueryDto>) {
    Object.assign(this, partial);
  }
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsNumber()
  @IsPositive()
  page: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsNumber()
  @IsPositive()
  limit: number = 20;
}
