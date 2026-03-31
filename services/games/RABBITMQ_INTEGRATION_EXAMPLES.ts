// /**
//  * EXEMPLO: Como usar RabbitmqProducerService
//  *
//  * Este arquivo mostra como integrar o RabbitmqProducerService
//  * em seus controllers e serviços para enviar mensagens.
//  */

// import { Controller, Post, Body, Logger } from "@nestjs/common";
// import { RabbitmqProducerService } from "@/infrastructure/rabbitmq/rabbitmq.producer";
// import { v4 as uuidv4 } from "uuid";

// /**
//  * EXEMPLO 1: Usar em um Controller
//  */
// @Controller("api/games")
// export class GamesControllerExample {
//   private readonly logger = new Logger(GamesControllerExample.name);

//   constructor(private readonly producer: RabbitmqProducerService) {}

//   /**
//    * POST /api/games/bet
//    * Quando um usuário faz uma aposta, enviar mensagem para RabbitMQ
//    */
//   @Post("bet")
//   async placeBet(
//     @Body() dto: { userId: string; betAmount: number; gameType: string },
//   ) {
//     try {
//       const externalId = uuidv4();

//       // Aqui você implementaria a lógica de colocar a aposta no banco de dados
//       // ...

//       // Depois, enviar a mensagem
//       await this.producer.publishBetPlaced(
//         dto.userId,
//         dto.betAmount,
//         dto.gameType,
//         externalId,
//       );

//       return {
//         success: true,
//         message: "Aposta realizada com sucesso",
//         externalId,
//       };
//     } catch (error) {
//       this.logger.error("Erro ao processar aposta:", error);
//       throw error;
//     }
//   }

//   /**
//    * POST /api/games/result
//    * Quando um jogo é finalizado, enviar o resultado
//    */
//   @Post("result")
//   async publishResult(
//     @Body()
//     dto: {
//       userId: string;
//       gameType: string;
//       resultAmount: number;
//       betAmount: number;
//       isWon: boolean;
//     },
//   ) {
//     try {
//       const externalId = uuidv4();

//       // Implementar lógica...

//       await this.producer.publishGameResult(
//         dto.userId,
//         dto.gameType,
//         dto.resultAmount,
//         dto.betAmount,
//         externalId,
//         dto.isWon,
//       );

//       return {
//         success: true,
//         message: "Resultado publicado",
//         externalId,
//       };
//     } catch (error) {
//       this.logger.error("Erro ao publicar resultado:", error);
//       throw error;
//     }
//   }
// }

// /**
//  * EXEMPLO 2: Usar em um Serviço
//  */
// import { Injectable, Logger as NestLogger } from "@nestjs/common";

// @Injectable()
// export class GameEngineServiceExample {
//   private readonly logger = new NestLogger(GameEngineServiceExample.name);

//   constructor(private readonly producer: RabbitmqProducerService) {}

//   /**
//    * Método chamado quando um round de jogo é completado
//    */
//   async completeRound(userId: string, gameType: string, result: any) {
//     try {
//       // Lógica do game engine...

//       // Se venceu
//       if (result.isWon) {
//         await this.producer.publishGameResult(
//           userId,
//           gameType,
//           result.winAmount,
//           result.betAmount,
//           result.externalId,
//           true,
//         );
//       } else {
//         // Se perdeu
//         await this.producer.publishGameResult(
//           userId,
//           gameType,
//           0,
//           result.betAmount,
//           result.externalId,
//           false,
//         );
//       }

//       this.logger.log("✅ Resultado enviado para fila");
//     } catch (error) {
//       this.logger.error("Erro ao enviar resultado:", error);
//       // Re-throw ou handle conforme necessário
//       throw error;
//     }
//   }

//   /**
//    * Método exemplo para processar um saque
//    */
//   async processWithdraw(userId: string, amount: number) {
//     try {
//       const externalId = uuidv4();

//       // Lógica para processar saque...

//       await this.producer.publishWithdraw(userId, amount, externalId);

//       this.logger.log("✅ Saque enviado para fila");
//       return { success: true, externalId };
//     } catch (error) {
//       this.logger.error("Erro ao processar saque:", error);
//       throw error;
//     }
//   }
// }

// /**
//  * EXEMPLO 3: Métodos Auxiliares Reutilizáveis
//  *
//  * Se você quer uma camada de abstração, pode criar um serviço específico
//  */
// @Injectable()
// export class GameEventPublisherService {
//   constructor(private readonly producer: RabbitmqProducerService) {}

//   async publishGameEventWithRetry(
//     eventType: "bet" | "result" | "withdraw" | "deposit",
//     data: any,
//     maxRetries: number = 3,
//   ) {
//     let lastError: Error | null = null;

//     for (let i = 0; i < maxRetries; i++) {
//       try {
//         switch (eventType) {
//           case "bet":
//             await this.producer.publishBetPlaced(
//               data.userId,
//               data.betAmount,
//               data.gameType,
//               data.externalId,
//             );
//             break;
//           case "result":
//             await this.producer.publishGameResult(
//               data.userId,
//               data.gameType,
//               data.resultAmount,
//               data.betAmount,
//               data.externalId,
//               data.isWon,
//             );
//             break;
//           case "withdraw":
//             await this.producer.publishWithdraw(
//               data.userId,
//               data.amount,
//               data.externalId,
//             );
//             break;
//           case "deposit":
//             await this.producer.publishDeposit(
//               data.userId,
//               data.amount,
//               data.externalId,
//             );
//             break;
//         }
//         return { success: true, attempt: i + 1 };
//       } catch (error) {
//         lastError = error as Error;
//         if (i < maxRetries - 1) {
//           // Aguardar antes de tentar novamente (exponential backoff)
//           await new Promise((resolve) =>
//             setTimeout(resolve, Math.pow(2, i) * 1000),
//           );
//         }
//       }
//     }

//     throw lastError;
//   }
// }

// /**
//  * EXEMPLO 4: Usar em um WebSocket Gateway
//  *
//  * Para casos onde você quer enviar eventos em tempo real via WebSocket
//  * E também para a fila de mensagens
//  */
// import {
//   WebSocketGateway,
//   WebSocketServer,
//   SubscribeMessage,
// } from "@nestjs/websockets";
// import { Server } from "ws";

// @WebSocketGateway()
// export class GameGatewayExample {
//   @WebSocketServer()
//   server!: Server;

//   constructor(private readonly producer: RabbitmqProducerService) {}

//   @SubscribeMessage("place-bet")
//   async onPlaceBet(client: any, data: any) {
//     try {
//       const externalId = uuidv4();

//       // Enviar para RabbitMQ
//       await this.producer.publishBetPlaced(
//         data.userId,
//         data.betAmount,
//         data.gameType,
//         externalId,
//       );

//       // Enviar confirmação ao cliente
//       client.emit("bet-placed", {
//         success: true,
//         externalId,
//       });

//       // Broadcast para todos os clientes (opcional)
//       this.server.emit("user-bet", {
//         userId: data.userId,
//         gameType: data.gameType,
//         amount: data.betAmount,
//       });
//     } catch (error) {
//       client.emit("error", {
//         message: "Erro ao colocar aposta",
//       });
//     }
//   }
// }
