import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app/app.module";
import { setupMicroservices } from "./configs/rabbitmq.config";
import { setupWebsocket } from "./configs/websocket.config";
import { setupSwagger } from "./configs/swagger.config";
import { appConfig } from "./configs/app.config";

async function bootstrap() {
  const{ port } = appConfig;
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("wallets");

  setupMicroservices(app);
  setupWebsocket(app);
  const { apiEnpoint } = setupSwagger(app);

  await app.startAllMicroservices();
  await app.listen(port, "0.0.0.0", () => {
    console.log(`Wallets service rodando na porta ${port}`);
    console.log(
      `Documentação disponível em http://localhost:${port}/${apiEnpoint}`,
    );
  });
}

bootstrap();
