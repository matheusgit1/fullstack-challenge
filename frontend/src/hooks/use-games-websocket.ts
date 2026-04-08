// hooks/useWebSocket.ts
import { useEffect, useRef, useCallback } from "react";
import { useGameStore } from "@/stores/game-store";
import { Round, Bet } from "@/types/games";

const WS_URL = "ws://localhost:4001/ws";

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export function useGameWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT = 5;

  const { setCurrentRound, updateMultiplier, addBet, updateBet, clearBets } =
    useGameStore();

  // Mapeia cada evento do backend para ações da store
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        const { type, data } = message;

        switch (type) {
          // Fase de apostas iniciou
          case "round.betting.started":
            // clearBets();
            // setCurrentRound({
            //   id: data.roundId ?? data.id,
            //   status: "betting",
            //   multiplier: 1.0,
            //   crashPoint: null,
            //   bettingEndsAt: data.bettingEndsAt
            //     ? new Date(data.bettingEndsAt)
            //     : null,
            //   startedAt: null,
            //   crashedAt: null,
            //   serverSeedHash: data.serverSeedHash ?? null,
            // });
            console.log("Fase de apostas iniciou", message);
            break;

          // Rodada começou a correr
          case "betting.running":
            // setCurrentRound({
            //   ...useGameStore.getState().currentRound!,
            //   status: "running",
            //   startedAt: new Date(),
            // });
            console.log("Rodada começou a correr", message);
            break;

          // Multiplicador atualizado em tempo real
          case "multiplier.updated":
            // updateMultiplier(data.multiplier ?? data.value);
            console.log("Multiplicador atualizado em tempo real", message);
            break;

          // Rodada crashou
          case "betting.crashed":
            // setCurrentRound({
            //   ...useGameStore.getState().currentRound!,
            //   status: "crashed",
            //   crashPoint: data.crashPoint ?? data.multiplier,
            //   crashedAt: new Date(),
            // });
            console.log("Rodada crashou", message);
            break;

          // Apostas perdedoras processadas
          case "betting.loose":
            // const { currentBets } = useGameStore.getState();
            // currentBets.forEach((bet) => {
            //   if (bet.status === "pending") {
            //     updateBet(bet.id, {
            //       status: "lost",
            //       multiplier: data.crashPoint ?? data.multiplier,
            //     });
            //   }
            // });
            console.log("Apostas perdedoras processadas", message);
            break;

          // Confirmação de conexão do backend
          case "connection":
            console.log("✅ WS conectado:", data.clientId);
            reconnectAttempts.current = 0;
            break;

          // Pong do servidor
          case "pong":
            console.log("🏓 WS pong:", data.clientId);
            break;

          default:
            console.warn("Evento WS desconhecido:", type, data);
        }
      } catch (err) {
        console.error("Erro ao processar mensagem WS:", err);
      }
    },
    [setCurrentRound, updateMultiplier, addBet, updateBet, clearBets],
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("🔌 WebSocket conectado");
      reconnectAttempts.current = 0;
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      console.log("🔌 WebSocket desconectado");
      // Reconexão com backoff exponencial
      if (reconnectAttempts.current < MAX_RECONNECT) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
        reconnectAttempts.current++;
        console.log(
          `Reconectando em ${delay}ms... (tentativa ${reconnectAttempts.current})`,
        );
        reconnectTimerRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = (err) => {
      console.error("Erro WS:", err);
      ws.close();
    };
  }, [handleMessage]);

  // Envia mensagem ao backend (ex: ping, bet confirmada)
  const send = useCallback((type: string, data?: any) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({ type, data, timestamp: new Date().toISOString() }),
    );
  }, []);

  // Ping para manter conexão viva
  useEffect(() => {
    const ping = setInterval(() => send("ping"), 30000);
    return () => clearInterval(ping);
  }, [send]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { send, isConnected: wsRef.current?.readyState === WebSocket.OPEN };
}
