
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class EventListenerService {
  constructor() {}

  @OnEvent("betting.running")
  async handleNewBettingEvent(payload: any) {
    console.log("bet running:", payload);
    this.processNewBetting(payload);
  }

  @OnEvent("betting.crashed")
  async handleGameCrashedEvent(payload: any) {
    console.log("bet crashed:", payload);
  }

  private async processNewBetting(payload: any) {
    console.log(`Processing new betting action at ${payload}`);
  }
}
