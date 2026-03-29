const amqp = require('amqplib');

async function send() {
  const queue = 'cashin';
  const msg = {
    pattern: 'bet_placed', // importante pro Nest reconhecer
    data: {
      userId: 1,
      amount: 100
    }
  };

  try {
    const connection = await amqp.connect('amqp://admin:admin@localhost:5672');
    const channel = await connection.createChannel();

    await channel.assertQueue(queue, { durable: true });

    channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(msg)),
      { persistent: true }
    );

    console.log('Mensagem enviada:', msg);

    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);
  } catch (err) {
    console.error(err);
  }
}

send();