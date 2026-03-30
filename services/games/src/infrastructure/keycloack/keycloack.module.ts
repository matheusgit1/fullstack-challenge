import { ConfigModule, ConfigService } from "@nestjs/config";
import { Module } from "@nestjs/common";
import { KeycloakService } from "./keycloack.service";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [KeycloakService, ConfigService],
  exports: [KeycloakService, ConfigService],
})
export class KeycloakModule {}
