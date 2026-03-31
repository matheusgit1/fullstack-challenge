# ⚡ Quick Start - RabbitMQ Games Service

## 🚀 Começar em 2 Minutos

### 1️⃣ Inicie o Docker (se não estiver rodando)
```bash
docker compose up -d
```

### 2️⃣ Inicie o Serviço Games
```bash
cd services/games
npm run dev
# ou: bun run --watch src/main.ts
```

### 3️⃣ Envie Mensagens de Teste
```bash
cd services/games
node rabbitmq.producer-mocked.js
```

✅ **Pronto!** Veja as mensagens nos logs do serviço games

---

## 📊 Arquivos de Referência

| Arquivo | Descrição |
|---------|-----------|
| [RABBITMQ.md](./RABBITMQ.md) | 📖 Documentação completa |
| [RABBITMQ_SETUP_SUMMARY.md](./RABBITMQ_SETUP_SUMMARY.md) | 📋 Resumo do setup |
| [RABBITMQ_INTEGRATION_EXAMPLES.ts](./RABBITMQ_INTEGRATION_EXAMPLES.ts) | 💡 Exemplos de código |
| [RABBITMQ_WALLETS_COMPARISON.md](./RABBITMQ_WALLETS_COMPARISON.md) | 🔄 Comparação com wallets |

---

## 🧪 Scripts Disponíveis

### Producer Mocked (Teste)
```bash
node rabbitmq.producer-mocked.js
# Envia 5 mensagens de exemplo
# ✅ Aposta
# ✅ Resultado (vitória)  
# ✅ Resultado (derrota)
# ✅ Saque
# ✅ Depósito
```

### Consumer Example (Visualizar)
```bash
node rabbitmq.consumer-example.js
# Consome as mensagens da fila e exibe em tempo real
# Pressione CTRL+C para parar
```

---

## 💻 Integração no Código

### Enviar Mensagem
```typescript
constructor(private producer: RabbitmqProducerService) {}

async placeBet(userId: string, amount: number) {
  await this.producer.publishBetPlaced(userId, amount, 'crash', externalId);
}
```

### Receber Mensagem
Automático via `RabbitmqController` (já configurado)

---

## 🔍 Monitoramento

**RabbitMQ Management UI:**
```
http://localhost:15672
User: admin
Pass: admin
```

**Docker Logs:**
```bash
docker compose logs -f games
```

---

## 📝 Mensagens Suportadas

```typescript
"game.bet.placed"    // Aposta realizada
"game.result"        // Resultado do jogo  
"wallet.withdraw"    // Saque
"wallet.deposit"     // Depósito
```

---

## ⚠️ Troubleshooting Rápido

| Erro | Solução |
|------|---------|
| Connection refused | `docker compose up -d` |
| Queue already exists | Acesse UI e delete a fila |
| Mensagens não processam | Verifique `cd services/games && npm run dev` |

---

## 📚 Onde Está Tudo?

```
services/games/
├── src/infrastructure/rabbitmq/        ← Core RabbitMQ
├── configs/rabbitmq.config.ts          ← Configuração
├── rabbitmq.producer-mocked.js         ← Teste
├── rabbitmq.consumer-example.js        ← Visualização
└── RABBITMQ*.md                        ← Documentação
```

---

**Pronto para começar? Siga os 3 passos acima! 🎉**
