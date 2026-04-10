import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function getDatabaseConfig(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432') || 5432,
    username: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME_WALLETS || 'wallets',
    synchronize: true,
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    extra: {
      max: 20,
    },
    logging: process.env.DB_LOGGING === 'true',
    autoLoadEntities: true,
  };
}
