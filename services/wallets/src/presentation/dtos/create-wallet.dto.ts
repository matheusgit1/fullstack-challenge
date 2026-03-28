import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CreateWalletDto {
  @ApiProperty({
    description: 'ID do usuário (opcional, se não fornecido usa o do token)',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;
}