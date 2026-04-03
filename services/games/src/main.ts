import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { WsAdapter } from "@nestjs/platform-ws";
import { setupMicroservices } from "./configs/rabbitmq.config";
import { setupSwagger } from "./configs/swagger.config";
import { GlobalExceptionFilter } from "./filters/global-execeptions.filters";
import { ResponseInterceptor } from "./interceptor/response.interceptor";
import { AppModule } from "./modules/app/app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = 4001;

  app.useWebSocketAdapter(new WsAdapter(app));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.setGlobalPrefix("games");

  setupMicroservices(app);

  const { apiEnpoint } = setupSwagger(app);

  await app.startAllMicroservices();

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(port, "0.0.0.0", () => {
    console.log(`Games service rodando na porta ${port}`);
    console.log(
      `Documentação disponível em http://localhost:${port}/${apiEnpoint}`,
    );
    console.log(`WebSocket disponível em ws://localhost:${port}/ws`);
    console.log(`RabbitMQ consumer configurado`);
  });
}

bootstrap();
