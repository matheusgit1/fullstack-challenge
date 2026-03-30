import { ConfigModule } from '@nestjs/config';
import { HttpModule } from "@nestjs/axios";
import { Module, Global } from "@nestjs/common";
import { KeycloakModule } from "../keycloack/keycloack.module";
import { KeycloakService } from "../keycloack/keycloack.service";

@Global()
@Module({
  imports: [
    KeycloakModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule
  ],
  providers: [KeycloakService],
  exports: [KeycloakService],
})
export class AuthModule {}
