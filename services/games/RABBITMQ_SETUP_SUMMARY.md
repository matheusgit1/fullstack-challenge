# 🚀 RabbitMQ Integration - Setup Summary

## ✅ Arquivos Criados/Modificados

### Core RabbitMQ Infrastructure
- ✅ `services/games/src/infrastructure/rabbitmq/rabbitmq.service.ts` - Serviço receptor de mensagens
- ✅ `services/games/src/infrastructure/rabbitmq/rabbitmq.controller.ts` - Controlador para padrões de mensagens
- ✅ `services/games/src/infrastructure/rabbitmq/rabbitmq.module.ts` - Módulo RabbitMQ
- ✅ `services/games/src/infrastructure/rabbitmq/rabbitmq.producer.ts` - Serviço para enviar mensagens

### Configuration & Module Import
- ✅ `services/games/configs/rabbitmq.config.ts` - Já existia, mantido como está
- ✅ `services/games/src/modules/app/app.module.ts` - RabbitmqModule importado

### Testing & Documentation
- ✅ `services/games/rabbitmq.producer-mocked.js` - Script para testar envio de mensagens
- ✅ `services/games/rabbitmq.consumer-example.js` - Script para consumir e ver mensagens
- ✅ `services/games/RABBITMQ.md` - Documentação completa
- ✅ `services/games/RABBITMQ_INTEGRATION_EXAMPLES.ts` - Exemplos de integração

## 📋 Padrões de Mensagem Suportados

| Padrão | Descrição |
|--------|-----------|
| `game.bet.placed` | Quando um usuário faz uma aposta |
| `game.result` | Resultado do jogo (vitória/derrota) |
| `wallet.withdraw` | Solicitação de saque |
| `wallet.deposit` | Depósito realizado |

## 🧪 Como Testar

### Opção 1: Teste Rápido com Script Mocked

```bash
# Terminal 1 - Inicie o docker compose
docker compose up -d

# Terminal 2 - Inicie o serviço games
cd services/games
npm run dev  # ou: bun run --watch src/main.ts

# Terminal 3 - Execute o script de teste
cd services/games
node rabbitmq.producer-mocked.js
```

**Resultado esperado no terminal 2:**
```
🎮 Aposta recebida do RabbitMQ: { ... }
🎮 Resultado do jogo recebido do RabbitMQ: { ... }
💸 Saque recebido do RabbitMQ: { ... }
💰 Depósito recebido do RabbitMQ: { ... }
```

### Opção 2: Consumir Mensagens em Tempo Real

```bash
# Terminal 1 - Inicie docker compose
docker compose up -d

# Terminal 2 - Inicie o consumer exemplo
cd services/games
node rabbitmq.consumer-example.js

# Terminal 3 - Em outro terminal, execute o producer
cd services/games
node rabbitmq.producer-mocked.js
```

## 🔧 Como Integrar no Seu Código

### Enviar Mensagens (Producer)

```typescript
import { RabbitmqProducerService } from "@/infrastructure/rabbitmq/rabbitmq.producer";

@Injectable()
export class MyService {
  constructor(private producer: RabbitmqProducerService) {}

  async placeBet(userId: string, amount: number) {
    await this.producer.publishBetPlaced(
      userId,
      amount,
      'crash',
      uuidv4()
    );
  }
}
```

### Receber Mensagens (Consumer)

As mensagens são recebidas automaticamente via `RabbitmqController` e processadas por `RabbitmqService`.

Para adicionar lógica personalizada, modifique `RabbitmqService`:

```typescript
@Injectable()
export class RabbitmqService {
  async processBetPlaced(message: BetPlacedMessage) {
    this.logger.log("Processando aposta:", message);
    // Sua lógica aqui
  }
}
```

## 🔍 Monitoramento RabbitMQ

Acesse a UI do RabbitMQ:
- **URL:** http://localhost:15672
- **User:** admin
- **Password:** admin

Para ver filas e mensagens em tempo real.

## 📦 Variáveis de Ambiente

Adicione no seu `.env`:

```env
RABBITMQ_URI=amqp://admin:admin@localhost:5672
RABBITMQ_QUEUE=game_events
```

## ⚠️ Pontos Importantes

1. **Fila é compartilhada:** Por padrão usa `game_events`, mas pode mudar via `RABBITMQ_QUEUE`
2. **Reconhecimento (ACK):** Cada mensagem deve ser reconhecida `channel.ack()`
3. **Persistência:** Mensagens são persistentes (`durable: true`, `persistent: true`)
4. **Prefetch:** Configurado para processar 1 mensagem por vez (`prefetchCount: 1`)
5. **Erro:** Se houver erro, `nack()` é chamado e mensagem volta para a fila

## 🚨 Troubleshooting

### Erro: "ECONNREFUSED - RabbitMQ não conecta"
```bash
# Verifique se docker-compose está rodando
docker compose ps
docker compose up -d
```

### Erro: "Queue already declared with different arguments"
```bash
# Acesse a UI e delete a fila: http://localhost:15672
# Ou reinicie o docker
docker compose restart
```

### Mensagens não são processadas
- Verifique se o serviço games está rodando
- Verifique os logs: `docker compose logs games`
- Confirme que RabbitmqModule está importado em AppModule

## 📚 Referências

- [NestJS RabbitMQ Docs](https://docs.nestjs.com/microservices/rabbitmq)
- [RabbitMQ Official](https://www.rabbitmq.com)
- [amqplib](https://github.com/amqp-js/amqplib)

---

**Status:** ✅ RabbitMQ totalmente integrado e pronto para uso!
