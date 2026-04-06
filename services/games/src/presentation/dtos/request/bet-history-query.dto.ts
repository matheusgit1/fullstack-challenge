import { BetStatus } from '@/infrastructure/database/orm/entites/bet.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class BetsHistoryQueryDto {
  constructor(partial: Partial<BetsHistoryQueryDto>) {
    Object.assign(this, partial);
  }
  @ApiPropertyOptional({ example: 1, default: 1, nullable: true })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20, nullable: true })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  limit?: number = 20;

  @ApiPropertyOptional({ enum: BetStatus, example: BetStatus.PENDING, nullable: true })
  @IsEnum(BetStatus)
  @IsOptional()
  status?: BetStatus;
}
