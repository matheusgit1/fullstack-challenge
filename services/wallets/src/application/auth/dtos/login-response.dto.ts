import { ApiProperty } from "@nestjs/swagger";

export class LoginResponseDto {
  constructor(dto: LoginResponseDto) {
    Object.assign(this, dto);
  }

  @ApiProperty({
    description: "Token de acesso do Keycloak",
    example:
      "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJDcl85aWhDWjAyUVc3eEZpaGNQbEhBLUlhc0loRElKaWVDWUR0MW11NVZrIn0.eyJleHAiOjE3NzUwMDc4OTMsImlhdCI6MTc3NTAwNDI5MywianRpIjoib25ydHJvOmQxMThmODIyLTdmMDYtODQ4OS04YzI1LTUxOGQ5NmI1ZDZmOCIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9yZWFsbXMvY3Jhc2gtZ2FtZSIsInN1YiI6IjU3MTVhMGE1LTJjYzQtNGI1YS1iY2YwLTE5MTc3NjgzOTQ2ZiIsInR5cCI6IkJlYXJlciIsImF6cCI6ImNyYXNoLWdhbWUtY2xpZW50Iiwic2lkIjoiSGdSeVAwREJpMG5jVm5UUEYzZlRzQnlQIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJodHRwOi8vbG9jYWxob3N0OjUxNzMiXSwic2NvcGUiOiJvcGVuaWQgZW1haWwgcHJvZmlsZSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiVGVzdCBQbGF5ZXIiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJwbGF5ZXIiLCJnaXZlbl9uYW1lIjoiVGVzdCIsImZhbWlseV9uYW1lIjoiUGxheWVyIiwiZW1haWwiOiJwbGF5ZXJAY3Jhc2gtZ2FtZS5kZXYifQ.SVBL69ymdJPgVnD17TRM5IfZpLnWImA4yNTXmwfXV3Homgnn4Vj08dCl9-1dj7g5tHjqGNd9Aheg51H0NzvKbdnL7KSGAkgtN5dgZBLP1AjanwrOyV2pn1rvuRJE7IbDGLgDNWBmBUJk9Q5RnQ40Xh4GmaFNWDMfnWU_YyFDFDyZkiaSMA9SjK1JH41JP-o3M20hz7KjPAHKTcvxkZKgbz7uBWHgRCO9U2NEKaFCplMLP5E-e1rnvAp1eDVIEG4bzzOP5Q1IleC8y3RYH1CZ1OWufhDaoCZXQmyTs-ugnGU_hSn_u0m83BXeJbMF_CXw2ioe0Y4XFiE-xQ_GJgnAzw",
  })
  "accessToken": string;

  @ApiProperty({
    description: "Tempo de expiração do token em segundos",
    example: 3600,
  })
  "expiresIn": number;
  @ApiProperty({
    description: "Tempo de expiração do token de atualização em segundos",
    example: 1800,
  })
  "refreshExpiresIn": number;
  @ApiProperty({
    description: "Token de atualização do Keycloak",
    example:
      "eyJhbGciOiJIUzUxMiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJhOTQ2M2ZiMy01YTBlLTQ4MTUtYWE3OC1lYmY5YWMwMzg5NGEifQ.eyJleHAiOjE3NzUwMDYwOTMsImlhdCI6MTc3NTAwNDI5MywianRpIjoiNjQ3Mzc5N2YtZTQzNS1mODZiLWNiZTYtZjQ0ZmI0ZDE3YWFhIiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwL3JlYWxtcy9jcmFzaC1nYW1lIiwiYXVkIjoiaHR0cDovL2",
  })
  refreshToken: string;

  @ApiProperty({
    description: "Tipo do token",
    example: "Bearer",
  })
  tokenType: string;

  @ApiProperty({
    description: "ID token do Keycloak",
    example:
      "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJDcl85aWhDWjAyUVc3eEZpaGNQbEhBLUlhc0loRElKaWVDWUR0MW11NVZrIn0.eyJleHAiOjE3NzUwMDc4OTMsImlhdCI6MTc3NTAwNDI5MywianRpIjoiNGNiODZmZDUtZmIyOS0wMDY3LWEzMmItMjVjODM0N2Y0NzI5IiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwL3JlYWxtcy9jcmFzaC1nYW1lIiwiYXVkIjoiY3Jhc2gt",
  })
  idToken: string;

  @ApiProperty({
    description:
      "Indica se o usuário precisa atualizar a senha no próximo login",
    example: false,
  })
  "notBeforePolicy": number;

  @ApiProperty({
    description: "Estado da sessão do usuário no Keycloak",
    example: "HgRyP0DBi0ncVnTPF3fTsByP",
  })
  sessionState: string;

  @ApiProperty({
    description: "Âmbito dos tokens",
    example: "openid email profile",
  })
  scopes: string;
}
