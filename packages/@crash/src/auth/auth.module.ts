import { HttpModule, HttpService } from "@nestjs/axios";
import { Module, DynamicModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { KeycloakModule } from "@/keycloak/module/keycloack.module";
import { KeycloakService } from "@/keycloak/module/keycloack.service";
import { KeycloakModuleOptions } from "@/keycloak/types/keycloack.types";

@Module({})
export class AuthModule {
  static registerAsync({
    keycloack,
    httpOptions,
  }: {
    keycloack: KeycloakModuleOptions;
    httpOptions?: {
      timeout?: number;
      maxRedirects?: number;
    };
  }): DynamicModule {
    return {
      module: AuthModule,
      imports: [
        KeycloakModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (_: KeycloakModuleOptions) => ({
            baseUrl: keycloack.baseUrl,
            realm: keycloack.realm,
            clientId: keycloack.clientId,
            clientSecret: keycloack.clientSecret,
            timeout: keycloack.timeout || 5000,
            maxRedirects: keycloack.maxRedirects || 10,
          }),

          inject: [ConfigService, HttpService],
        }),
        HttpModule.register({
          timeout: httpOptions?.timeout || 5000,
          maxRedirects: httpOptions?.maxRedirects || 10,
        }),
        ConfigModule,
      ],
      controllers: [AuthController],
      providers: [KeycloakService, AuthService],
      exports: [KeycloakService, AuthService],
    };
  }
}
