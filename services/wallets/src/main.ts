import "reflect-metadata"; // Deve ser o primeiro import
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { WsAdapter } from "@nestjs/platform-ws";
import { AppModule } from "./modules/app/app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = 4002;

  app.useWebSocketAdapter(new WsAdapter(app));

  const config = new DocumentBuilder()
    .setTitle("Wallet API")
    .setDescription("The wallet API description")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document); // Passe o document diretamente

  await app.listen(port, "0.0.0.0", () => {
    console.log(`Wallets rodando na porta ${port}`);
    console.log(`Swagger disponivel em: http://localhost:${port}/api`);
  });
}

bootstrap();