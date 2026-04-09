import { useGameStore } from "@/stores/game-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Clock, Coins } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { faker } from "@faker-js/faker";

export function CurrentBets() {
  const { currentBets, currentRound, user } = useGameStore();

  const pendingBets = currentBets.filter((bet) => bet.status === "pending");
  const cashedOutBets = currentBets.filter(
    (bet) => bet.status === "cashed_out",
  );
  const lostBets = currentBets.filter((bet) => bet.status === "lost");

  const isRoundActive = currentRound?.status === "running";
  const isBettingPhase = currentRound?.status === "betting";
  const currentMultiplier = currentRound?.multiplier || 1;

  if (currentBets.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">
            {isBettingPhase
              ? "Nenhuma aposta ainda. Seja o primeiro!"
              : "Aguardando apostas para a próxima rodada..."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-yellow-500" />
          Apostas da Rodada
          <span className="text-sm text-slate-400 ml-2">
            ({currentBets.length} jogadores)
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Apostas Pendentes */}
        {pendingBets.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm text-slate-400">
              <Clock className="h-4 w-4" />
              <span>Aguardando Cashout ({pendingBets.length})</span>
            </div>
            <div className="space-y-2">
              {pendingBets.map((bet) => (
                <BetRow
                  key={bet.id}
                  bet={{
                    ...bet,
                    username:
                      user?.username || `Anonymous ${faker.person.firstName()}`,
                  }}
                  isCurrentUser={bet.userId === user?.id}
                  showPotentialWin={isRoundActive}
                  currentMultiplier={currentMultiplier}
                />
              ))}
            </div>
          </div>
        )}

        {/* Cashouts Realizados */}
        {cashedOutBets.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm text-green-500">
              <Trophy className="h-4 w-4" />
              <span>Cashouts Realizados ({cashedOutBets.length})</span>
            </div>
            <div className="space-y-2">
              {cashedOutBets.map((bet) => (
                <BetRow
                  key={bet.id}
                  bet={{
                    ...bet,
                    username:
                      user?.username || `Anonymous ${faker.person.firstName()}`,
                  }}
                  isCurrentUser={bet.userId === user?.id}
                  isCashedOut
                />
              ))}
            </div>
          </div>
        )}

        {/* Apostas Perdidas */}
        {lostBets.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm text-red-500">
              <span>💀</span>
              <span>Perderam ({lostBets.length})</span>
            </div>
            <div className="space-y-2">
              {lostBets.map((bet) => (
                <BetRow
                  key={bet.id}
                  bet={{
                    ...bet,
                    username:
                      user?.username || `Anonymous ${faker.person.firstName()}`,
                  }}
                  isCurrentUser={bet.userId === user?.id}
                  isLost
                />
              ))}
            </div>
          </div>
        )}

        {/* Legenda */}
        {isRoundActive && (
          <div className="pt-2 text-xs text-slate-500 border-t border-slate-800">
            💡 Cashout disponível enquanto o multiplicador estiver subindo
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente de linha da aposta
interface BetRowProps {
  bet: {
    id: string;
    username: string;
    amount: number;
    multiplier: number | null;
    status: string;
  };
  isCurrentUser?: boolean;
  isCashedOut?: boolean;
  isLost?: boolean;
  showPotentialWin?: boolean;
  currentMultiplier?: number;
}

function BetRow({
  bet,
  isCurrentUser,
  isCashedOut,
  isLost,
  showPotentialWin,
  currentMultiplier = 1,
}: BetRowProps) {
  const potentialWin = bet.amount * currentMultiplier;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg transition-all",
        isCurrentUser && "ring-1 ring-yellow-500/50 bg-yellow-500/5",
        !isCurrentUser && "bg-slate-800/50",
        isCashedOut && "bg-green-500/10",
        isLost && "bg-red-500/10",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
            isCurrentUser
              ? "bg-yellow-500/20 text-yellow-500"
              : "bg-slate-700 text-slate-300",
          )}
        >
          {bet.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn("font-medium", isCurrentUser && "text-yellow-500")}
            >
              {bet.username}
              {isCurrentUser && " (você)"}
            </span>
            {isCashedOut && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                Cashout {bet.multiplier?.toFixed(2)}x
              </span>
            )}
            {isLost && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                Perdeu
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Coins className="h-3 w-3 text-slate-500" />
            <span className="text-slate-400">
              R$ {(bet.amount / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="text-right">
        {showPotentialWin && !isCashedOut && !isLost && (
          <div className="text-sm">
            <span className="text-slate-400">potencial: </span>
            <span className="text-green-400 font-mono">
              R${" "}
              {(potentialWin / 100) /**converter para reais */
                .toFixed(2)}
            </span>
          </div>
        )}

        {isCashedOut && bet.multiplier && (
          <div className="text-sm">
            <span className="text-green-400 font-bold">
              + R$ {((bet.amount * bet.multiplier) / 100).toFixed(2)}
            </span>
            <span className="text-slate-500 text-xs ml-1">
              ({bet.multiplier.toFixed(2)}x)
            </span>
          </div>
        )}

        {isLost && (
          <div className="text-sm text-red-400">
            - R$ {(bet.amount / 100).toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
}
