import {
  TypeOrmModuleOptions,
  TypeOrmModuleAsyncOptions,
} from "@nestjs/typeorm";
import { ConfigService, ConfigModule } from "@nestjs/config";
import { getDatabaseConfig } from "@/configs/database.config";

export default class TypeORMConfig {
  static getORMConfig(): TypeOrmModuleOptions {
    return {
      ...getDatabaseConfig(),
    };
  }
}

export const DBClientConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  useFactory: async (): Promise<TypeOrmModuleOptions> =>
    TypeORMConfig.getORMConfig(),
  inject: [ConfigService],
};
