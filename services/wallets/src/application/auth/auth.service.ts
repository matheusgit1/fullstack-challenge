import { Injectable, Inject } from "@nestjs/common";
import { LoginResponseDto } from "./dtos/login-response.dto";
import { LoginDto } from "./dtos/login.dto";
import {
  type IKeyCloakService,
  KEYCLOACK_PROVIDER,
} from "@/domain/keycloack/keycloack.service";

@Injectable()
export class AuthService {
  constructor(
    @Inject(KEYCLOACK_PROVIDER) readonly keycloakService: IKeyCloakService,
  ) {}

  async validateToken(token?: string): Promise<User | void> {
    if (!token) {
      throw new Error("Token não fornecido");
    }

    return await this.keycloakService.getUserFromToken(token);
  }

  public async getToken(body: LoginDto): Promise<LoginResponseDto> {
    const tokenResponse = await this.keycloakService.getToken(body);
    return new LoginResponseDto({
      accessToken: tokenResponse.access_token,
      expiresIn: tokenResponse.expires_in,
      refreshExpiresIn: tokenResponse.refresh_expires_in,
      refreshToken: tokenResponse.refresh_token,
      tokenType: tokenResponse.token_type,
      idToken: tokenResponse.id_token,
      notBeforePolicy: Number(tokenResponse["not-before-policy"]),
      sessionState: tokenResponse.session_state,
      scopes: tokenResponse.scope,
    });
  }
}
