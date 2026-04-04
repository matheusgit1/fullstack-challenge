import {
  KEYCLOAK_MODULE_OPTIONS,
  type KeycloakModuleAsyncOptions,
} from "../types/keycloack.types";
import { DynamicModule, Global, Module } from "@nestjs/common";
import { KeycloakService } from "./keycloack.service";


@Module({})
export class KeycloakModule {
  static registerAsync(options: KeycloakModuleAsyncOptions): DynamicModule {
    return {
      module: KeycloakModule,
      imports: [...(options.imports || [])],
      providers: [
        {
          provide: KEYCLOAK_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        KeycloakService,
      ],
      exports: [KeycloakService],
    };
  }
}
