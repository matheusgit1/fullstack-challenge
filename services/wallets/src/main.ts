import 'reflect-metadata'
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app/app.module";
import { setupMicroservices } from "./configs/rabbitmq.config";
import { setupWebsocket } from "./configs/websocket.config";
import { setupSwagger } from "./configs/swagger.config";
import { appConfig } from "./configs/app.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupMicroservices(app);
  setupWebsocket(app);
  setupSwagger(app);

  await app.startAllMicroservices();
  await app.listen(appConfig.port, "0.0.0.0", () => {
    console.log(`🚀 Wallet running on port ${appConfig.port}`);
  });
}

bootstrap();
