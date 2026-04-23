"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users } from "lucide-react";
import { cn } from "@/app/_lib/utils";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ProvablyFairAudit } from "./provably-fair-audit";
import { RoundHistory } from "@/types/round";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

interface RoundDetailsModalProps {
  round: RoundHistory | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RoundDetailsModal({
  round,
  isOpen,
  onClose,
}: RoundDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"bets" | "audit">("bets");
  const { data: session } = useSession();
  const { toBRL } = useCurrencyFormat();

  if (!round) return null;

  const getCrashColor = (crashPoint: string | number) => {
    const point =
      typeof crashPoint === "number"
        ? crashPoint
        : parseFloat(crashPoint as string);
    if (point <= 1.5) return "text-red-500 bg-red-500/10";
    if (point <= 3) return "text-orange-500 bg-orange-500/10";
    if (point <= 5) return "text-yellow-500 bg-yellow-500/10";
    return "text-green-500 bg-green-500/10";
  };

  const totalBets = round.bets.reduce((sum, bet) => sum + bet.amount, 0);
  const totalPayout = round.bets
    .filter((bet) => bet.status === "cashed_out" && bet.multiplier)
    .reduce((sum, bet) => sum + bet.amount * (bet.multiplier || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[85vw] lg:w-[75vw] h-[90vh] !max-w-6xl rounded-xl bg-slate-900 border-slate-800 overflow-auto">
        <DialogHeader className="sticky top-0 bg-slate-900 z-10 pb-4 flex-shrink-0">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-yellow-500" />
            Auditoria da Rodada #{round.roundId.substring(0, 8)}...
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-xs text-slate-400 mb-1">
                    Pontos de Crash
                  </div>
                  <div
                    className={cn(
                      "text-2xl font-bold inline-block px-3 py-1 rounded-md",
                      getCrashColor(round.crashPoint),
                    )}
                  >
                    {round.crashPoint === "secret"
                      ? "???"
                      : `${round.crashPoint.toFixed(2)}x`}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Status</div>
                  <div className="text-sm font-semibold">
                    {round.status === "crashed" ? (
                      <span className="text-red-500">Finalizado</span>
                    ) : (
                      <span className="text-yellow-500">Em andamento</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">
                    Total Apostado
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {toBRL(totalBets)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Total Pago</div>
                  <div className="text-sm font-semibold text-green-500">
                    {toBRL(totalPayout)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">
                    Total de Apostas
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {round.bets.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs
            defaultValue="bets"
            className="w-full"
            onValueChange={(v) => setActiveTab(v as any)}
          >
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
              <TabsTrigger
                value="bets"
                className="data-[state=active]:bg-yellow-500/20"
              >
                <Users className="h-4 w-4 mr-2" />
                Apostas
              </TabsTrigger>
              <TabsTrigger
                value="audit"
                className="data-[state=active]:bg-yellow-500/20"
              >
                <Shield className="h-4 w-4 mr-2" />
                Provably Fair
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bets" className="mt-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 text-slate-400 font-normal">
                            Usuário
                          </th>
                          <th className="text-right py-2 text-slate-400 font-normal">
                            Valor
                          </th>
                          <th className="text-right py-2 text-slate-400 font-normal">
                            Multiplicador
                          </th>
                          <th className="text-right py-2 text-slate-400 font-normal">
                            Retorno
                          </th>
                          <th className="text-center py-2 text-slate-400 font-normal">
                            Status
                          </th>
                          <th className="text-right py-2 text-slate-400 font-normal">
                            Data
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {round.bets.map((bet) => {
                          const payout =
                            bet.status === "cashed_out" && bet.multiplier
                              ? bet.amount * bet.multiplier
                              : 0;

                          return (
                            <tr
                              key={bet.id}
                              className="border-b border-slate-800/50 hover:bg-slate-800/30"
                            >
                              <td className="py-2 text-slate-300">
                                {bet.userId == session?.user?.sub ||
                                bet.userId == session?.user?.id
                                  ? session.user.name
                                  : `Anonymous ${Math.random().toString(36).substring(7)}`}
                              </td>
                              <td className="py-2 text-right text-white font-mono">
                                {toBRL(bet.amount)}
                              </td>
                              <td className="py-2 text-right">
                                {bet.multiplier ? (
                                  <span
                                    className={cn(
                                      "font-mono font-bold",
                                      getCrashColor(bet.multiplier),
                                    )}
                                  >
                                    {bet.multiplier.toFixed(2)}x
                                  </span>
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </td>
                              <td className="py-2 text-right font-mono">
                                {payout > 0 ? (
                                  <span className="text-green-500 font-semibold">
                                    {toBRL(payout)}
                                  </span>
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </td>
                              <td className="py-2 text-center">
                                {bet.status === "cashed_out" ? (
                                  <span className="inline-flex items-center gap-1 text-green-500 text-xs px-2 py-1 rounded-full bg-green-500/10">
                                    ✓ Sacado
                                  </span>
                                ) : bet.status === "lost" ? (
                                  <span className="inline-flex items-center gap-1 text-red-500 text-xs px-2 py-1 rounded-full bg-red-500/10">
                                    ✗ Perdeu
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-yellow-500 text-xs px-2 py-1 rounded-full bg-yellow-500/10">
                                    ⌛ Pendente
                                  </span>
                                )}
                              </td>
                              <td className="py-2 text-right text-xs text-slate-500">
                                {new Date(bet.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="mt-4">
              <ProvablyFairAudit
                roundId={round.roundId}
                roundStatus={round.status}
                roundCrashPoint={
                  round.crashPoint === "secret" ? undefined : round.crashPoint
                }
                roundMultiplier={round.multiplier}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
