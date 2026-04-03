import { Reflector } from "@nestjs/core";
import { type Request } from "express";
import { AuthGuardType, AUTH_GUARD_TYPE } from "./auth.decorator";
import {
  CanActivate,
  Dependencies,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { KeycloakService } from "../keycloack/keycloack.service";

@Injectable()
@Dependencies(Reflector, KeycloakService)
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private keycloackService: KeycloakService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authGuardType: AuthGuardType = this.reflector.getAllAndOverride(
      AUTH_GUARD_TYPE,
      [context.getHandler(), context.getClass()],
    );

    const token = request.headers["authorization"]?.split(" ")[1];

    switch (authGuardType) {
      case AuthGuardType.GUARD:
        const res = await this.keycloackService.getUserFromToken(
          token || "fake token",
        );
        request.user = res;
        if (res) {
          return true;
        }
        return false;
      case AuthGuardType.NONE:
        return true;
      default:
        return false;
    }
  }
}
