import { ApiProperty } from '@nestjs/swagger';

export class WalletResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ example: 5000.0, description: 'Saldo em reais (R$)' })
  balance: number;

  @ApiProperty({ example: 500000, description: 'Saldo em centavos (para garantir precisão)' })
  balanceInCents: number;

  @ApiProperty({ example: '2024-01-01T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T12:00:00Z' })
  updatedAt: Date;
}