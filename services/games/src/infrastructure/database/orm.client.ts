import {
  TypeOrmModuleOptions,
  TypeOrmModuleAsyncOptions,
} from "@nestjs/typeorm";
import { ConfigService, ConfigModule } from "@nestjs/config";

export default class TypeORMConfig {
  static getORMConfig(): TypeOrmModuleOptions {
    return {
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432") || 5432,
      username: process.env.DB_USER || "admin",
      password: process.env.DB_PASSWORD || "admin",
      database: process.env.DB_NAME_GAMES || "games",
      synchronize: process.env.NODE_ENV !== "production",
      // ssl: { rejectUnauthorized: false }, // this is needed to connect to the database in production, but should be set to false in development
      entities: [__dirname + "/../**/*.entity.{js,ts}"],
      extra: {
        max: 20, // Configuração do pool
      },
      logging: process.env.DB_LOGGING === "true",
      autoLoadEntities: true,
    };
  }
}

export const DBClientConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  useFactory: async (): Promise<TypeOrmModuleOptions> =>
    TypeORMConfig.getORMConfig(),
  inject: [ConfigService],
};

// import { Global, Module } from "@nestjs/common";
// import { ConfigModule, ConfigService } from "@nestjs/config";
// import { TypeOrmModule } from "@nestjs/typeorm";
// import { Bet } from "./entites/bet.entity";
// import { Round } from "./entites/round.entity";
// import { OutboxMessage } from "./entites/outbox.entity";
// import { RoundRepository } from "./repository/round.repository";
// import { BetRepository } from "./repository/bet.repository";
// import { OutboxRepository } from "./repository/outbox.repository";

// @Module({
//   imports: [
//     TypeOrmModule.forRoot({
//       type: "postgres",
//       host: process.env.DB_HOST || "localhost",
//       port: parseInt(process.env.DB_PORT || "5432") || 5432,
//       username: process.env.DB_USER || "admin",
//       password: process.env.DB_PASSWORD || "admin",
//       database: process.env.DB_NAME_GAMES || "games",
//       synchronize: process.env.NODE_ENV !== "production",
//       // ssl: { rejectUnauthorized: false }, // this is needed to connect to the database in production, but should be set to false in development
//       entities: [Bet, Round, OutboxMessage],
//     }),
//   ],
//   providers: [OutboxRepository, BetRepository, RoundRepository],
//   exports: [TypeOrmModule, OutboxRepository, BetRepository, RoundRepository], // , OutboxRepository, BetRepository, RoundRepository
// })
// export class DatabaseModule {}

// // import { DataSource } from "typeorm";
// // import { Global, Module } from "@nestjs/common";
// // import { ConfigService } from "@nestjs/config";
// // import * as dotenv from "dotenv";
// // import { BetRepository } from "./repository/bet.repository";
// // import { OutboxRepository } from "./repository/outbox.repository";
// // import { RoundRepository } from "./repository/round.repository";

// // dotenv.config();

// // @Module({
// //   providers: [
// //     {
// //       provide: DataSource, // add the datasource as a provider
// //       inject: [ConfigService],
// //       useFactory: async (config: ConfigService) => {
// //         // using the factory function to create the datasource instance
// //         try {
// //           const dataSource = new DataSource({
// //             type: "postgres",
// //             host: config.get("DB_HOST", "localhost"),
// //             port: config.get<number>("DB_PORT", 5432),
// //             username: config.get("DB_USER", "admin"),
// //             password: config.get<string>("DB_PASSWORD", "admin"),
// //             database: config.get("DB_NAME_GAMES", "games"),
// //             synchronize: config.get("NODE_ENV", "development") !== "production",
// //             // ssl: { rejectUnauthorized: false }, // this is needed to connect to the database in production, but should be set to false in development
// //             entities: [`${__dirname}/../**/**.entity{.ts,.js}`],
// //           });
// //           await dataSource.initialize();
// //           console.log("Database connected successfully");
// //           return dataSource;
// //         } catch (error) {
// //           console.error("Error connecting to database");

// //           throw error;
// //         }
// //       },
// //     },
// //     OutboxRepository, BetRepository, RoundRepository,
// //   ],
// //   exports: [DataSource],
// // })
// // export class DatabaseModule {}
