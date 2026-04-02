import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setupSwagger(app: INestApplication<any>) {
  const apiEnpoint = "api-games";
  const config = new DocumentBuilder()
    .setTitle("Games API")
    .setDescription("The games API description")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        description: "Enter JWT token",
        in: "header",
      },
      "access-token",
    )
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(apiEnpoint, app, documentFactory);
  return { apiEnpoint };
}
