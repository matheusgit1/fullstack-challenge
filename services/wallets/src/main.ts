import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { setupMicroservices } from './configs/rabbitmq.config';
import { setupSwagger } from './configs/swagger.config';
import { appConfig } from './configs/app.config';
import { GlobalExceptionFilter } from './filters/global-execeptions.filters';
import { ResponseInterceptor } from './interceptor/response.interceptor';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const { port } = appConfig;
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('wallets');

  setupMicroservices(app);
  const { apiEnpoint } = setupSwagger(app);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.startAllMicroservices();
  await app.listen(port, '0.0.0.0', () => {
    console.log(`Wallets service rodando na porta ${port}`);
    console.log(`Documentação disponível em http://localhost:${port}/${apiEnpoint}`);
  });
}

bootstrap();
