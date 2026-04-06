import { ApiProperty } from "@nestjs/swagger";

export class HealthCheckResponseDto {
  constructor(partial: HealthCheckResponseDto) {
    Object.assign(this, partial);
  }
  @ApiProperty({ example: "OK", default: "OK" })
  status: string;

  @ApiProperty({ example: "wallets", default: "wallets" })
  service: string;
}
