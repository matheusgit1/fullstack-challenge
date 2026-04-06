import {
  CanActivate,
  Dependencies,
  ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { KeycloakService } from "../../infrastructure/keycloack/keycloack.service";
import { AuthGuardType, AUTH_GUARD_TYPE } from "./auth.decorator";
import {
  type IKeyCloakService,
  KEYCLOACK_PROVIDER,
} from "@/domain/keycloack/keycloack.service";

@Injectable()
@Dependencies(Reflector, KeycloakService)
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(KEYCLOACK_PROVIDER)
    private keycloackService: IKeyCloakService,
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
        const user = await this.keycloackService.getUserFromToken(token);
        request.user = user;
        request.token = token;
        return !!token;
      case AuthGuardType.NONE:
        return true;
      default:
        return false;
    }
  }
}
