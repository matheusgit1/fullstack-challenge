
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { HttpService, HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [JwtStrategy, AuthService],
  controllers: [AuthController],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
