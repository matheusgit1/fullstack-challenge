import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ description: "Username do usuário", example: "player" })
  @IsString()
  username: string;

  @IsString()
  @ApiProperty({ description: "Senha do usuário", example: "player123" })
  password: string;
}
