import { ConfigModule } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { Module, Global } from "@nestjs/common";
import { KeycloakModule } from "../../infrastructure/keycloack/keycloack.module";
import { KeycloakService } from "../../infrastructure/keycloack/keycloack.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Global()
@Module({
  imports: [
    KeycloakModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [KeycloakService, AuthService],
  exports: [KeycloakService, AuthService],
})
export class AuthModule {}
