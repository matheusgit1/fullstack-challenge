
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class EventListenerService {
  constructor() {}

  //configurar nova aposta na base, emitir evento via web socket, etc
  @OnEvent("betting.running")
  async handleNewBettingEvent(payload: any) {
    console.log("bet running:", payload);
    // Lógica para lidar com o evento de nova aposta
    this.processNewBetting(payload);
  }

  @OnEvent("betting.crashed")
  async handleGameCrashedEvent(payload: any) {
    console.log("bet crashed:", payload);
    // Lógica para lidar com o evento de game crashado
  }

  private async processNewBetting(payload: any) {
    console.log(`Processing new betting action at ${payload.timestamp}`);
  }
}
