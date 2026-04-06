import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import { Auth, AuthGuardType } from "./auth.decorator";
import { AuthService } from "./auth.service";
import { LoginResponseDto } from "./dtos/login-response.dto";
import { LoginDto } from "./dtos/login.dto";

@Controller("auth")
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Get("validate-token")
  @Auth(AuthGuardType.NONE)
  public async validateToken(@Query("token") token?: string): Promise<void> {
    const userToken = token;
    await this.authService.validateToken(userToken);
  }

  @Post("/login")
  @Auth(AuthGuardType.NONE)
  public async login(@Body() body: LoginDto): Promise<LoginResponseDto> {
    return await this.authService.getToken(body);
  }
}
