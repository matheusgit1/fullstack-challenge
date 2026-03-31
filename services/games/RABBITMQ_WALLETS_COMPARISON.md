# 🔄 Comparação: Wallets vs Games - Implementação RabbitMQ

## Estrutura Comparada

### Wallets Service
```
services/wallets/
├── src/
│   ├── configs/
│   │   └── rabbitmq.config.ts          ← Configuração
│   ├── infrastructure/
│   │   └── rabbitmq/
│   │       ├── rabbitmq.controller.ts
│   │       ├── rabbitmq.service.ts
│   │       └── rabbitmq.module.ts
│   └── modules/app/app.module.ts       ← Importa RabbitmqModule
└── rabbitmq.producer-mocked.js         ← Script de teste

```

### Games Service (Nova Implementação)
```
services/games/
├── configs/
│   └── rabbitmq.config.ts              ← Configuração (já existia)
├── src/
│   ├── infrastructure/
│   │   └── rabbitmq/
│   │       ├── rabbitmq.controller.ts  ← ✅ NOVO
│   │       ├── rabbitmq.service.ts     ← ✅ NOVO
│   │       ├── rabbitmq.module.ts      ← ✅ NOVO
│   │       └── rabbitmq.producer.ts    ← ✅ NOVO (diferença)
│   └── modules/app/app.module.ts       ← ✅ ATUALIZADO
├── rabbitmq.producer-mocked.js         ← ✅ NOVO (estilo wallets)
├── rabbitmq.consumer-example.js        ← ✅ NOVO (bônus)
├── RABBITMQ.md                         ← ✅ NOVO
├── RABBITMQ_INTEGRATION_EXAMPLES.ts    ← ✅ NOVO (bônus)
└── RABBITMQ_SETUP_SUMMARY.md           ← ✅ NOVO (este arquivo)
```

## Diferenças Principais

### 1. **Configuração**

#### Wallets
```typescript
// rabbitmq.config.ts
export const rabbitConfig = {
  uri: process.env.RABBITMQ_URI || "amqp://admin:admin@localhost:5672",
  queue: process.env.RABBITMQ_QUEUE || "cashin",
};
```

#### Games (idêntico, apenas queue diferente)
```typescript
// rabbitmq.config.ts
export const rabbitConfig = {
  uri: process.env.RABBITMQ_URI || "amqp://admin:admin@localhost:5672",
  queue: process.env.RABBITMQ_QUEUE || "game_events", // ← Nome diferente
};
```

### 2. **Padrões de Mensagem**

#### Wallets - Apenas Financeiro
| Padrão | Tipo |
|--------|------|
| `cash` | Cashin/Cashout |

#### Games - Múltiplos Domínios
| Padrão | Tipo |
|--------|------|
| `game.bet.placed` | Bet placed |
| `game.result` | Game result |
| `wallet.withdraw` | Withdrawal |
| `wallet.deposit` | Deposit |

### 3. **Service Processor**

#### Wallets
```typescript
@Injectable()
export class RabbitmqService {
  async processCashin(message: CashinMessage) { ... }
  async processCashout(message: CashoutMessage) { ... }
}
```

#### Games (mais completo)
```typescript
@Injectable()
export class RabbitmqService {
  async processBetPlaced(message: BetPlacedMessage) { ... }
  async processGameResult(message: GameResultMessage) { ... }
  async processWithdraw(message: any) { ... }
  async processDeposit(message: any) { ... }
}
```

### 4. **Producer Service** 

#### Wallets
❌ **NÃO TEM** - Usa apenas o script mocked para testes

#### Games
✅ **TEM** - `rabbitmq.producer.ts` para uso em produção
```typescript
@Injectable()
export class RabbitmqProducerService {
  async publishBetPlaced(...) { ... }
  async publishGameResult(...) { ... }
  async publishWithdraw(...) { ... }
  async publishDeposit(...) { ... }
}
```

**Benefício:** Você pode injetar `RabbitmqProducerService` em qualquer componente para enviar mensagens

### 5. **Scripts de Teste**

#### Wallets - Producer Mocked
```bash
node rabbitmq.producer-mocked.js
# Envia 2 mensagens (cashin, cashout)
```

#### Games - Producer Mocked
```bash
node rabbitmq.producer-mocked.js
# Envia 5 mensagens (bet, resultado W, resultado L, withdrawal, deposit)
```

#### Games - Consumer Example (NOVO - Bônus)
```bash
node rabbitmq.consumer-example.js
# Consome e exibe as mensagens em tempo real
```

## Fluxo de Mensagens

### Wallets
```
[Cliente HTTP] 
    ↓
[Wallets Service - recebe transação]
    ↓
[RabbitmqService.processCashin/Out]
    ↓
[Atualiza wallet no DB]
```

### Games (Nova Integração)
```
[Cliente WebSocket/HTTP]
    ↓
[Games Service - user plays game]
    ↓
[RabbitmqProducerService - envia evento]
    ↓
[RabbitMQ (fila)]
    ↓
[RabbitmqController - recebe]
    ↓
[RabbitmqService - processa]
    ↓
[Lógica customizada]
```

## Comparação: O que é Igual?

✅ Ambas usam `@nestjs/microservices`  
✅ Ambas usam RabbitMQ com `amqplib`  
✅ Ambas usam o mesmo padrão de `Module`, `Controller`, `Service`  
✅ Ambas reconhecem mensagens com `channel.ack()`  
✅ Ambas descartam com erro com `channel.nack()`  
✅ Ambas usam `@MessagePattern` com pipes nomeados  
✅ Ambas fazem log detalhado  

## Comparação: O que é Diferente?

| Aspecto | Wallets | Games |
|---------|---------|-------|
| **Padrões** | 1 (`cash`) | 4 (`game.*`, `wallet.*`) |
| **Producer Service** | ❌ Não | ✅ Sim |
| **Métodos Producer** | - | 4 métodos |
| **Consumer Examples** | - | ✅ Sim |
| **Documentação** | - | ✅ Extensiva |
| **Integration Examples** | - | ✅ Sim |
| **Use Case** | Transações | Eventos + Transações |

## Como Usar em Produção

### 1. No Games Service
```typescript
// games.service.ts
@Injectable()
export class GamesService {
  constructor(private producer: RabbitmqProducerService) {}

  async completeBet(userId: string, result: any) {
    await this.producer.publishGameResult(
      userId,
      result.gameType,
      result.winAmount,
      result.betAmount,
      result.externalId,
      result.isWon
    );
  }
}
```

### 2. Receiving no Wallets Service
```typescript
// If wallets also needs to listen to game events
@MessagePattern("game.result")
async onGameResult(
  @Payload() message: GameResultMessage,
  @Ctx() context: RmqContext
) {
  // Process game result and update wallet
  // ...
}
```

## Próximas Evoluções

1. **Dead Letter Queue (DLQ)** para mensagens com erro
2. **Retry Policy** com exponential backoff
3. **Message Encryption** para dados sensíveis
4. **Async Event Processing** com melhor separação de concerns
5. **Metrics & Monitoring** via Prometheus
6. **Circuit Breaker** para falhas em cascata

## Checklist de Testes

- [ ] Docker compose está rodando (`docker compose ps`)
- [ ] Serviço games inicia sem erros (`npm run dev`)
- [ ] RabbitmqModule está importado em AppModule
- [ ] Script producer-mocked funciona (`node rabbitmq.producer-mocked.js`)
- [ ] Mensagens aparecem nos logs do games
- [ ] Acessar RabbitMQ UI (http://localhost:15672)
- [ ] Verificar fila `game_events` com mensagens
- [ ] Consumer example funciona (`node rabbitmq.consumer-example.js`)

---

**Conclusão:** A implementação de RabbitMQ no Games Service segue o mesmo padrão do Wallets, mas com suporte para múltiplos tipos de eventos e com um Producer Service integrado para facilitar o envio de mensagens em produção! 🚀
