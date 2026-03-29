import { SetMetadata } from "@nestjs/common";

export const AUTH_GUARD_TYPE = "AUTH_GUARD_TYPE";
export enum AuthGuardType {
  GUARD,
  NONE,
}

/**
 * Guard responsável por validar permissionamento do usuário.
 * @param type O tipo é utilizado para defirnir se a autenticação deve ser apenas por rota. `Default: AuthGuardType.ROUTE_ONLY`
 */
export const Auth = (type: AuthGuardType = AuthGuardType.GUARD) =>
  SetMetadata(AUTH_GUARD_TYPE, type);
