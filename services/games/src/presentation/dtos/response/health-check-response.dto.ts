import { ApiProperty } from "@nestjs/swagger";

export class HealthCheckResponseDto {
  @ApiProperty({ example: "OK" })
  status: string;

  @ApiProperty({ example: "games" })
  service: string;
}
