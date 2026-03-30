import { ApiProperty } from "@nestjs/swagger";

export class RoundVerifyResponseDto {
  constructor(partial: RoundVerifyResponseDto) {
    Object.assign(this, partial);
  }
  @ApiProperty({ example: "round_1734567890123" })
  roundId: string;

  @ApiProperty({ example: 5.23 })
  crashPoint: number;

  @ApiProperty({ description: "Server seed usado na rodada" })
  serverSeed: string;

  @ApiProperty({ description: "Client seed usado na rodada" })
  clientSeed: string;

  @ApiProperty({ example: 0, description: "Nonce usado" })
  nonce: number;

  @ApiProperty({ description: "Hash do server seed (pré-rodada)" })
  serverSeedHash: string;

  @ApiProperty({ description: "Como o crash point foi calculado" })
  calculationFormula: string;

  @ApiProperty({ description: "Resultado do cálculo bruto" })
  rawResult: string;

  @ApiProperty({ description: "Verificação se o hash corresponde ao seed" })
  isValid: boolean;
}
