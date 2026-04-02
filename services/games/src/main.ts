import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app/app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { WsAdapter } from "@nestjs/platform-ws";
import { setupMicroservices } from "./configs/rabbitmq.config";
import { setupSwagger } from "./configs/swagger.config";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = 4001;

  app.useWebSocketAdapter(new WsAdapter(app));
  app.setGlobalPrefix("games");
  setupMicroservices(app);

  await app.startAllMicroservices();

  const { apiEnpoint } = setupSwagger(app);

  await app.listen(port, "0.0.0.0", () => {
    console.log(`Games service rodando na porta ${port}`);
    console.log(
      `Documentação disponível em http://localhost:${port}/${apiEnpoint}`,
    );
  });
}

bootstrap();
