import { INestApplication } from "@nestjs/common";
import { WsAdapter } from "@nestjs/platform-ws";

export function setupWebsocket(app: INestApplication<any>) {
  app.useWebSocketAdapter(new WsAdapter(app));
}
