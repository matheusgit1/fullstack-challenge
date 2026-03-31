import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app/app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { WsAdapter } from "@nestjs/platform-ws";
import { setupMicroservices} from '../configs/rabbitmq.config'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = 4001;

  app.useWebSocketAdapter(new WsAdapter(app));

  setupMicroservices(app);

  await app.startAllMicroservices();

  const config = new DocumentBuilder()
    .setTitle("Games API")
    .setDescription("The games API description")
    .setVersion("1.0")
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-games", app, documentFactory);

  await app.listen(port, "0.0.0.0");
  console.log(`Games service running on port ${port}`);
  console.log(`Documentação disponível em http://localhost:${port}/api-games`);
}

bootstrap();
