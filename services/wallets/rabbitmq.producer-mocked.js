const amqp = require('amqplib');
const crypto = require('crypto');
const userId = '328b5bea-d4f9-4a58-a504-5a12c2be5220'

const type = {
  BET_PLACED: "bet_placed",
  BET_LOST: "bet_lost",
  BET_RESERVE: "bet_reserve",
}

const reserveIdForBetLost = crypto.randomUUID();
const reserveIdForBetPlaced = crypto.randomUUID();

const idForBetLost = reserveIdForBetLost
const idForBetPlaced = reserveIdForBetPlaced



const msg_reserve_win = {
  pattern: 'cash',
  data: {
    cashType: type.BET_RESERVE,
    userId: userId,
    amount: 1000 * 100, // 1000 reais em centavos
    externalId: reserveIdForBetLost,
    timestamp: new Date().toISOString()
  }
}

const msg_reserve_lost = {
  pattern: 'cash',
  data: {
    cashType: type.BET_RESERVE,
    userId: userId,
    amount: 1000 * 100, // 500 reais em centavos
    externalId: reserveIdForBetPlaced,
    timestamp: new Date().toISOString()
  }
}


const msg_cashin = {
  pattern: 'cash',
  data: {
    cashType: type.BET_PLACED,
    userId: userId,
    multiplier: 1.3,
    externalId:  idForBetPlaced, 
    timestamp: new Date().toISOString()
  }
};

// const msg_cashout = {
//   pattern: 'cash',
//   data: {
//     cashType: type.BET_LOST,
//     userId: userId,
//     externalId: idForBetLost, 
//     timestamp: new Date().toISOString()
//   }
// };

const msgs = [
  msg_reserve_win,
  msg_reserve_lost,
  msg_cashin,
  // msg_cashout
]


async function send() {
  const queue = 'cashin';
  try {
    const connection = await amqp.connect('amqp://admin:admin@localhost:5672');
    const channel = await connection.createChannel();

    await channel.assertQueue(queue, { durable: true });

    for (const msg of msgs) {
      channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(msg)),
        { persistent: true }
      );

      console.log('Mensagem enviada:', msg);
    }

    // channel.sendToQueue(
    //   queue,
    //   Buffer.from(JSON.stringify(msg_reserve)),
    //   { persistent: true }
    // );

    // channel.sendToQueue(
    //   queue,
    //   Buffer.from(JSON.stringify(msg_cashin)),
    //   { persistent: true }
    // );

    // channel.sendToQueue(
    //   queue,
    //   Buffer.from(JSON.stringify(msg_cashout)),
    //   { persistent: true }
    // );

    // console.log('Mensagem enviada:', msg_reserve);
    // console.log('Mensagem enviada:', msg_cashin);
    // console.log('Mensagem enviada:', msg_cashout);

    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 2000);
  } catch (err) {
    console.error(err);
  }
}

send();