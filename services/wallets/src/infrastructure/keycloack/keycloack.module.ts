import { HttpModule } from "@nestjs/axios";
import { Global, Module } from "@nestjs/common";
import { KeycloakService } from "./keycloack.service";
import { KEYCLOACK_PROVIDER } from "@/domain/keycloack/keycloack.service";

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [
    {
      provide: KEYCLOACK_PROVIDER,
      useClass: KeycloakService,
    },
  ],
  exports: [KEYCLOACK_PROVIDER],
})
export class KeycloakModule {}
