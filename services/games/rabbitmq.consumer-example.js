const amqp = require('amqplib');

async function consume() {
  const queue = 'game_events';

  try {
    const connection = await amqp.connect('amqp://admin:admin@localhost:5672');
    const channel = await connection.createChannel();

    await channel.assertQueue(queue, { durable: true });
    await channel.prefetch(1);

    console.log('🎮 Consumer iniciado - aguardando mensagens...\n');
    console.log(`📨 Fila: ${queue}`);
    console.log(`⏸️  Pressione CTRL+C para parar\n`);

    channel.consume(queue, (msg) => {
      if (msg) {
        const content = msg.content.toString();
        const parsedMsg = JSON.parse(content);

        console.log('\n═════════════════════════════════════════');
        console.log('📬 MENSAGEM RECEBIDA');
        console.log('═════════════════════════════════════════');
        console.log(`Pattern: ${parsedMsg.pattern}`);
        console.log('Dados:');
        console.log(JSON.stringify(parsedMsg.data, null, 2));
        console.log('═════════════════════════════════════════\n');

        // Simular processamento
        setTimeout(() => {
          channel.ack(msg);
          console.log('✅ Mensagem reconhecida (ACK)\n');
        }, 1000);
      }
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Encerrando...');
      await channel.close();
      await connection.close();
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Erro ao conectar:', err);
    process.exit(1);
  }
}

consume();
