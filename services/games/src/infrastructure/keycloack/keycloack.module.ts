import { HttpService } from '@nestjs/axios';
import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KeycloakService } from './keycloack.service';
import { KEYCLOACK_PROVIDER } from '@/domain/keycloack/keycloack.service';

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [
    {
      provide: KEYCLOACK_PROVIDER,
      useClass: KeycloakService,
    },
    ConfigService,
  ],
  exports: [ConfigService, KEYCLOACK_PROVIDER],
})
export class KeycloakModule {}
