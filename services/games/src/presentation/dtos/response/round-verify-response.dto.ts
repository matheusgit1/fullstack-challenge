import { ApiProperty } from "@nestjs/swagger";

export class RoundVerifyResponseDto {
  constructor(partial: RoundVerifyResponseDto) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: "fair_1734567890123" })
  fairId: string;

  @ApiProperty({ description: "Server seed usado na rodada" })
  serverSeed: string;

  @ApiProperty({ description: "Client seed usado na rodada" })
  clientSeed: string;

  @ApiProperty({ example: 0, description: "Nonce usado" })
  nonce: number;

  @ApiProperty({ description: "Hash do server seed (pré-rodada)" })
  serverSeedHash: string;
}
