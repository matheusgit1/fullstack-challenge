# RabbitMQ Integration - Games Service 🐇🎮

Este documento descreve como o RabbitMQ foi integrado no serviço de games para enviar e receber mensagens de forma assíncrona.

## Estrutura

```
services/games/src/infrastructure/rabbitmq/
├── rabbitmq.controller.ts      # Controlador que recebe mensagens
├── rabbitmq.service.ts         # Serviço que processa mensagens
├── rabbitmq.module.ts          # Módulo do RabbitMQ
└── rabbitmq.producer.ts        # Serviço para enviar mensagens
```

## Configuração

A configuração está em `services/games/configs/rabbitmq.config.ts`:

```typescript
export const rabbitConfig = {
  uri: process.env.RABBITMQ_URI || "amqp://admin:admin@localhost:5672",
  queue: process.env.RABBITMQ_QUEUE || "game_events",
};
```

### Variáveis de Ambiente

```bash
RABBITMQ_URI=amqp://admin:admin@localhost:5672
RABBITMQ_QUEUE=game_events
```

## Mensagens Suportadas

### 1. **game.bet.placed** - Aposta Realizada

Enviada quando um usuário faz uma aposta no jogo.

```typescript
{
  pattern: "game.bet.placed",
  data: {
    userId: string;           // ID do usuário
    betAmount: number;        // Valor da aposta em centavos
    gameType: string;         // Tipo de jogo (crash, roulette, mines)
    externalId: string;       // UUID único da aposta
    timestamp: string;        // ISO timestamp
  }
}
```

### 2. **game.result** - Resultado do Jogo

Enviada quando um jogo é finalizado com resultado.

```typescript
{
  pattern: "game.result",
  data: {
    userId: string;           // ID do usuário
    gameType: string;         // Tipo de jogo
    resultAmount: number;     // Valor ganho em centavos
    betAmount: number;        // Valor original da aposta
    externalId: string;       // UUID único do resultado
    isWon: boolean;           // Se o jogo foi vencido
    timestamp: string;        // ISO timestamp
  }
}
```

### 3. **wallet.withdraw** - Saque

Enviada quando o usuário solicita um saque.

```typescript
{
  pattern: "wallet.withdraw",
  data: {
    userId: string;           // ID do usuário
    amount: number;           // Valor do saque em centavos
    externalId: string;       // UUID único do saque
    timestamp: string;        // ISO timestamp
  }
}
```

### 4. **wallet.deposit** - Depósito

Enviada quando um depósito é realizado.

```typescript
{
  pattern: "wallet.deposit",
  data: {
    userId: string;           // ID do usuário
    amount: number;           // Valor do depósito em centavos
    externalId: string;       // UUID único do depósito
    timestamp: string;        // ISO timestamp
  }
}
```

## Como Usar

### Receber Mensagens

As mensagens são recebidas automaticamente através do `RabbitmqController` que está configurado no `AppModule`.

Você pode adicionar lógica personalizada no `RabbitmqService`:

```typescript
// Exemplo em algum componente
@Injectable()
export class GamesService {
  constructor(private rabbitmqService: RabbitmqService) {}

  async processBetLogic() {
    // Sua lógica aqui
  }
}
```

### Enviar Mensagens

Use o `RabbitmqProducerService` em qualquer componente injetável:

```typescript
import { RabbitmqProducerService } from "@/infrastructure/rabbitmq/rabbitmq.producer";

@Injectable()
export class GameEngineService {
  constructor(private producer: RabbitmqProducerService) {}

  async completeBet() {
    await this.producer.publishGameResult(
      userId,
      "crash",
      resultAmount,
      betAmount,
      externalId,
      true // isWon
    );
  }
}
```

## Teste com Script Mocked

Um script de teste foi criado para simular envio de mensagens: `rabbitmq.producer-mocked.js`

### Como Executar

1. **Certifique-se de que o RabbitMQ está rodando:**

```bash
# Docker Compose
docker compose up -d
```

2. **Abra um terminal na pasta do serviço games:**

```bash
cd services/games
```

3. **Execute o script de teste:**

```bash
node rabbitmq.producer-mocked.js
```

### O que o Script Faz

Envia 5 mensagens de teste com intervalo de 500ms:

1. ✅ **game.bet.placed** - Simula uma aposta
2. ✅ **game.result** (vitória) - Simula um jogo vencido
3. ✅ **game.result** (derrota) - Simula um jogo perdido
4. ✅ **wallet.withdraw** - Simula um saque
5. ✅ **wallet.deposit** - Simula um depósito

**Output esperado:**

```
✅ Mensagem 1 enviada: game.bet.placed
✅ Mensagem 2 enviada: game.result
✅ Mensagem 3 enviada: game.result
✅ Mensagem 4 enviada: wallet.withdraw
✅ Mensagem 5 enviada: wallet.deposit
```

## Monitoramento

Para verificar as mensagens na fila, pode usar:

```bash
# Com docker
docker exec -it <container_id> rabbitmqctl list_queues

# Ou acessar a UI: http://localhost:15672
# Username: admin
# Password: admin
```

## Tratamento de Erros

- **Mensagens com erro** → `nack(originalMsg, false, false)` - Mensagem descartada
- **Mensagens processadas com sucesso** → `ack(originalMsg)` - Mensagem reconhecida
- **Logs detalhados** → Use `this.logger.log/error/warn()`

## Próximos Passos

1. Implementar lógica específica em `RabbitmqService`
2. Adicionar tratamento de duplicação de mensagens
3. Implementar retry policy
4. Add circuit breaker se necessário
5. Implementar Dead Letter Queue (DLQ) para mensagens com erro

## Referências

- [NestJS Microservices - RabbitMQ](https://docs.nestjs.com/microservices/rabbitmq)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [amqplib Documentation](https://github.com/amqp-js/amqplib)
