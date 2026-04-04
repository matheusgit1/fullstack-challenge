import { HttpModule } from '@nestjs/axios';
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KeycloakModule } from '../../infrastructure/keycloack/keycloack.module';
import { KeycloakService } from '../../infrastructure/keycloack/keycloack.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { KEYCLOACK_PROVIDER } from '@/domain/keycloack/keycloack.service';

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
  providers: [
    {
      provide: KEYCLOACK_PROVIDER,
      useClass: KeycloakService,
    },
    AuthService,
  ],
  exports: [KEYCLOACK_PROVIDER, AuthService],
})
export class AuthModule {}
