import { ApiProperty } from "@nestjs/swagger";
import { BetDto, RoundDto } from "../index";

export class CurrentRoundResponseDto extends RoundDto {


  // @ApiProperty({
  //   description: "Aposta do jogador autenticado nesta rodada",
  //   nullable: true,
  //   type: BetDto,
  // })
  // myBet: BetDto | null;
}
