import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ description: "Username do usuário", example: "player" })
  username: string;
  @ApiProperty({ description: "Senha do usuário", example: "player123" })
  password: string;
}
