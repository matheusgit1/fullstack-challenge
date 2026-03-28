
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { createRemoteJWKSet, decodeProtectedHeader } from "jose";
import type { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(configService: ConfigService) {
    const keycloakUrl = configService.get<string>(
      "KEYCLOAK_URL",
      "http://localhost:8080",
    );
    const realm = configService.get<string>("KEYCLOAK_REALM", "crash-game");
    const audience = configService.get<string>(
      "KEYCLOAK_CLIENT_ID",
      "crash-game-client",
    );
    const jwksUri = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;

    const JWKS = createRemoteJWKSet(new URL(jwksUri));

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      issuer: `${keycloakUrl}/realms/${realm}`,
      audience,
      algorithms: ["RS256"],
      secretOrKeyProvider: async (
        request: Request,
        rawJwtToken: string,
        done: (
          err: Error | null,
          //@ts-ignore
          secretOrKey?: string | Buffer | Buffer[] | import("jose").KeyLike,
        ) => void,
      ) => {
        try {
          const header = decodeProtectedHeader(rawJwtToken);
          const key = await JWKS(header);
          return done(null, key);
        } catch (err) {
          return done(
            err instanceof Error
              ? err
              : new Error("Unable to resolve signing key"),
          );
        }
      },
    });
  }

  async validate(payload: any) {
    if (!payload) {
      throw new UnauthorizedException("Token inválido");
    }

    return {
      sub: payload.sub,
      username: payload.preferred_username || payload.name || payload.email,
      email: payload.email,
      realm_access: payload.realm_access,
      resource_access: payload.resource_access,
    };
  }
}
