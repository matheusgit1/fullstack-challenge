import { ApiProperty } from "@nestjs/swagger";
import { BetDto, RoundDto } from "../index";

export class CurrentRoundResponseDto extends RoundDto {
  public constructor(partial: CurrentRoundResponseDto) {
    super(partial);
    Object.assign(this, partial);
  }

  @ApiProperty({
    description: "Aposta do jogador autenticado nesta rodada",
    nullable: true,
    type: BetDto,
  })
  myBet: BetDto | null;
}
