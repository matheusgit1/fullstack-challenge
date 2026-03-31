const amqp = require('amqplib');
const crypto = require('crypto');

const userId = 'd1a6c9bb-563b-46d7-bdde-456583b979d5';

const gameTypes = {
  CRASH: "crash",
  ROULETTE: "roulette",
  MINES: "mines",
};

async function send() {
  const queue = 'game_events';

  // Simular uma aposta
  const msg_bet_placed = {
    pattern: 'game.bet.placed',
    data: {
      userId: userId,
      betAmount: 100 * 100, // 100 reais em centavos
      gameType: gameTypes.CRASH,
      externalId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }
  };

  // Simular um resultado de jogo (vitória)
  const msg_game_result_win = {
    pattern: 'game.result',
    data: {
      userId: userId,
      gameType: gameTypes.CRASH,
      resultAmount: 250 * 100, // 250 reais em centavos
      betAmount: 100 * 100,
      externalId: crypto.randomUUID(),
      isWon: true,
      timestamp: new Date().toISOString()
    }
  };

  // Simular um resultado de jogo (derrota)
  const msg_game_result_loss = {
    pattern: 'game.result',
    data: {
      userId: userId,
      gameType: gameTypes.CRASH,
      resultAmount: 0,
      betAmount: 50 * 100,
      externalId: crypto.randomUUID(),
      isWon: false,
      timestamp: new Date().toISOString()
    }
  };

  // Simular um saque
  const msg_withdraw = {
    pattern: 'wallet.withdraw',
    data: {
      userId: userId,
      amount: 150 * 100, // 150 reais em centavos
      externalId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }
  };

  // Simular um depósito
  const msg_deposit = {
    pattern: 'wallet.deposit',
    data: {
      userId: userId,
      amount: 300 * 100, // 300 reais em centavos
      externalId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }
  };

  try {
    const connection = await amqp.connect('amqp://admin:admin@localhost:5672');
    const channel = await connection.createChannel();

    await channel.assertQueue(queue, { durable: true });

    // Enviar todas as mensagens
    const messages = [
      msg_bet_placed,
      msg_game_result_win,
      msg_game_result_loss,
      msg_withdraw,
      msg_deposit
    ];

    messages.forEach((msg, index) => {
      setTimeout(() => {
        channel.sendToQueue(
          queue,
          Buffer.from(JSON.stringify(msg)),
          { persistent: true }
        );
        console.log(`✅ Mensagem ${index + 1} enviada:`, msg.pattern);
      }, index * 500); // Enviar com 500ms de intervalo
    });

    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 3000);
  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
}

send();
