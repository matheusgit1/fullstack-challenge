const amqp = require('amqplib');
const crypto = require('crypto');
const userId = 'd1a6c9bb-563b-46d7-bdde-456583b979d5'

const type = {
  BET_PLACED: "bet_placed",
  BET_LOST: "bet_lost",
}

async function send() {
  const queue = 'cashin';
  const msg_cashin = {
    pattern: 'cash',
    data: {
      cashType: type.BET_PLACED,
      userId: userId,
      amount: 100 * 200, // 200 reais em centavos
      externalId: crypto.randomUUID(), 
      timestamp: new Date().toISOString()
    }
  };

  const msg_cashout = {
    pattern: 'cash',
    data: {
      cashType: type.BET_LOST,
      userId: userId,
      amount: 25 * 100, // 25 reais em centavos
      externalId: crypto.randomUUID(), 
      timestamp: new Date().toISOString()
    }
  };

  try {
    const connection = await amqp.connect('amqp://admin:admin@localhost:5672');
    const channel = await connection.createChannel();

    await channel.assertQueue(queue, { durable: true });

    channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(msg_cashin)),
      { persistent: true }
    );

    channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(msg_cashout)),
      { persistent: true }
    );

    console.log('Mensagem enviada:', msg_cashin);
    console.log('Mensagem enviada:', msg_cashout);

    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);
  } catch (err) {
    console.error(err);
  }
}

send();