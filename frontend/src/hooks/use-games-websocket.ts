import { useEffect, useRef, useCallback, useState } from "react";
import { useGameStore } from "@/stores/game-store";
import { useGamesApi } from "./use-games-api";

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
  const MAX_RECONNECT = 3;

  const [error, setError] = useState<Error | null>(null);

  if (error) throw error;

  const {
    setCurrentRound,
    updateMultiplier,
    addBet,
    updateBet,
    clearBets,
    currentBets,
    currentRound,
  } = useGameStore();

  const { fetchCurrentRound } = useGamesApi();

  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        const { type, data } = message;

        switch (type) {
          case "round.multiple.updated":
            updateMultiplier(data.multiplier);
            break;

          case "round.crashed":
            setCurrentRound({
              ...useGameStore.getState().currentRound!,
              status: "crashed",
              crashPoint: data.crashPoint,
            });

            currentBets.map((bet) => {
              if (bet.status === "pending") {
                updateBet(bet.id, { status: "lost" });
              }
            });
            break;

          case "betting.phase":
            await fetchCurrentRound();
            break;

          case "betting.running":
            setCurrentRound({
              ...useGameStore.getState().currentRound!,
              status: "running",
              startedAt: new Date().toISOString(),
            });
            break;

          case "betting.new":
            await fetchCurrentRound();

          case "betting.loose":
            data.bets.forEach((bet: any) => {
              updateBet(bet.id, { status: "lost" });
            });
            break;

          case "betting.cashout":
            data.bets.forEach((bet: any) => {
              updateBet(bet.id, {
                status: "cashed_out",
                multiplier: bet.multiplier,
              });
            });
            break;

          case "connection":
            console.log("✅ WS conectado:", data.clientId);
            reconnectAttempts.current = 0;
            break;

          case "pong":
            console.log("🏓 WS pong:", data.clientId);
            break;

          default:
            console.warn("Evento WS desconhecido:", type, data);
        }
      } catch (err) {
        console.warn("Erro ao processar mensagem WS:", err);
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
        if (reconnectAttempts.current >= MAX_RECONNECT) {
          // setError(
          //   new Error(
          //     `WebSocket indisponível após ${MAX_RECONNECT} tentativas`,
          //   ),
          // );
        }
      }
    };

    ws.onerror = (err) => {
      console.warn("Erro WS:", err);
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
