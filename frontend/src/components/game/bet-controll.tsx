import { useState } from "react";
import { useGameStore } from "@/stores/game-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

export function BetControls() {
  const [betAmount, setBetAmount] = useState(10);
  const { currentRound, myBet, user, isLoading, placeBet, cashOut } =
    useGameStore();
  const router = useRouter();
  const { toBRL } = useCurrencyFormat();

  const canBet = currentRound?.status === "betting" && !myBet && !isLoading;
  const canCashOut =
    currentRound?.status === "running" &&
    myBet?.status === "pending" &&
    !isLoading;
  const potentialWin =
    myBet?.amount && currentRound?.multiplier
      ? myBet.amount * currentRound.multiplier
      : 0;

  const handlePlaceBet = async () => {
    if (betAmount < 1) {
      // toast.error('Aposta mínima: R$ 1,00')
      return;
    }
    if (betAmount > 1000) {
      // toast.error('Aposta máxima: R$ 1.000,00')
      return;
    }
    if (user && betAmount > user.balance) {
      // toast.error('Saldo insuficiente')
      return;
    }

    await placeBet(betAmount);
  };

  const handleCashOut = async () => {
    cashOut();
  };

  const presetAmounts = [10, 50, 100, 500];

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Saldo</span>
            <span className="text-2xl font-bold text-green-500">
              R$ {(user?.balance ?? 0).toFixed(2)}
            </span>
          </div>

          <div className="flex justify-end items-center">
            <Button
              onClick={() => router.push("/bets")}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              Minhas Apostas
            </Button>
          </div>

          {!myBet && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  min={1}
                  max={1000}
                  step={1}
                  className="bg-slate-800 border-slate-700 text-white"
                  disabled={!canBet}
                />
                <Button
                  onClick={handlePlaceBet}
                  disabled={!canBet}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Apostar"
                  )}
                </Button>
              </div>

              <div className="flex gap-2">
                {presetAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setBetAmount(amount)}
                    disabled={!canBet}
                    className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                  >
                    R$ {amount}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {myBet && myBet.status === "pending" && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Aposta</span>
                <span>R$ {toBRL(myBet.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Ganho potencial</span>
                <span className="text-green-500 font-bold">
                  R$ {toBRL(potentialWin)}
                </span>
              </div>
              <Button
                onClick={handleCashOut}
                disabled={!canCashOut}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  `CASH OUT • ${(currentRound?.multiplier ?? 0).toFixed(2)}x`
                )}
              </Button>
            </div>
          )}

          {myBet && myBet.status !== "pending" && (
            <div className="text-center p-4 rounded-lg bg-slate-800">
              {myBet.status === "cashed_out" && (
                <div>
                  <p className="text-green-500 font-bold">
                    ✓ Sacou em {(myBet.multiplier ?? 0).toFixed(2)}x
                  </p>
                  <p className="text-xl font-bold text-green-500">
                    + R$ {toBRL(myBet.amount * (myBet.multiplier || 0))}
                  </p>
                </div>
              )}
              {myBet.status === "lost" && (
                <div>
                  <p className="text-red-500 font-bold">✗ Perdeu a aposta</p>
                  <p className="text-slate-400">- R$ {toBRL(myBet.amount)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
