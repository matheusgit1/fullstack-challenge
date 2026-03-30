# Custom Types - Express Request Extension

Este documento explica como estender o tipo `Request` do Express para incluir propriedades customizadas como `user`.

## Problema

Por padrão, o tipo `Request` do Express não inclui propriedades customizadas como `user`. Quando tentamos acessar `req.user`, o TypeScript gera o erro:

```
Property 'user' does not exist on type 'Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>'
```

## Solução

Usamos **Module Augmentation** do TypeScript para estender a interface `Request` do Express.

## Estrutura de Arquivos

```
src/
├── types/
│   ├── index.ts          # Exporta todos os tipos
│   ├── user.ts           # Interface User
│   └── express.d.ts      # Extensão do Express
```

## Como Funciona

### 1. Definir a Interface User (`types/user.ts`)

```typescript
export interface User {
  id: string;
  email: string;
  username: string;
  roles?: string[];
}
```

### 2. Estender o Express (`types/express.d.ts`)

```typescript
import { User } from "./user";

declare module "express" {
  interface Request {
    user?: User;
  }
}
```

### 3. Usar nos Guards/Controllers

```typescript
import type { Request } from "express";

// No AuthGuard
async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest<Request>();
  request.user = await this.getUserFromToken(token); // ✅ Type-safe
  return !!request.user;
}

// No Controller
async getMyBets(@Req() req: Request) {
  const userId = req.user?.id; // ✅ IntelliSense e type checking
  // ...
}
```

## Benefícios

- ✅ **Type Safety**: IntelliSense completo para `req.user`
- ✅ **Prevenção de Bugs**: Erros de digitação são detectados em compile-time
- ✅ **Documentação**: Tipos servem como documentação viva
- ✅ **Reutilização**: Propriedade `user` disponível globalmente em toda aplicação

## Exemplo Completo de Uso

```typescript
// Em qualquer controller/guard/service
import type { Request } from "express";

export class MyController {
  @Get("profile")
  getProfile(@Req() req: Request) {
    // TypeScript sabe que req.user existe e tem tipo User
    if (req.user) {
      return {
        id: req.user.id,
        email: req.user.email,
        roles: req.user.roles,
      };
    }
    throw new UnauthorizedException();
  }
}
```

## Extensões Futuras

Para adicionar mais propriedades customizadas:

```typescript
declare module "express" {
  interface Request {
    user?: User;
    tenant?: string;        // Para multi-tenancy
    correlationId?: string; // Para tracing
    permissions?: string[]; // Para controle de acesso granular
  }
}
```

## TypeScript Configuration

Certifique-se de que o TypeScript reconhece os arquivos `.d.ts`:

```json
{
  "compilerOptions": {
    "typeRoots": ["./src/types", "./node_modules/@types"]
  }
}
```

## Testes

Para testar os tipos customizados:

```typescript
describe("AuthGuard", () => {
  it("should attach user to request", () => {
    const mockRequest = {} as Request;
    // TypeScript permitirá:
    mockRequest.user = { id: "123", email: "test@example.com" };
    // Mas não permitirá tipos incorretos:
    // mockRequest.user = "invalid"; // ❌ Erro de tipo
  });
});
```