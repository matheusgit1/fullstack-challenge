"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ChevronLeft, ChevronRight, Eye, Shield } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { RoundDetailsModal } from "./round-details-modal";
import { RoundHistory } from "@/types/games";

interface Bet {
  id: string;
  roundId: string;
  userId: string;
  amount: number;
  multiplier: number | null;
  status: string;
  cashedOutAt: Date | null;
  createdAt: string;
  updatedAt: string;
  username?: string;
}

interface Round {
  roundId: string;
  crashPoint: number | "secret";
  serverSeedHash: string;
  endedAt: string;
  status: string;
  multiplier: number;
  bettingStartedAt: string;
  bettingEndsAt: string;
  roundStartedAt: string;
  roundCrashedAt: string;
  serverSeed?: string;
  clientSeed?: string;
  nonce?: number;
  createdAt: string;
  updatedAt: string;
  bets: Bet[];
  _count?: {
    bets: number;
  };
}

interface RoundsListProps {
  initialRounds?: RoundHistory[];
}

export function RoundsList({ initialRounds = [] }: RoundsListProps) {
  const [rounds, setRounds] = useState<RoundHistory[]>(initialRounds);
  const [loading, setLoading] = useState(!initialRounds.length);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRound, setSelectedRound] = useState<RoundHistory | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const roundsPerPage = 20;

  useEffect(() => {
    if (!initialRounds.length) {
      fetchRounds();
    }
  }, [currentPage]);

  const fetchRounds = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/rounds?page=${currentPage}&limit=${roundsPerPage}`,
      );
      const data = await response.json();
      setRounds(data.rounds);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching rounds:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleViewDetails = (round: RoundHistory) => {
    setSelectedRound(round);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-slate-400" />
            Histórico Completo de Rodadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2 text-xs text-slate-500 pb-2 border-b border-slate-800">
              <span>Rodada</span>
              <span className="text-center">Crash</span>
              <span className="text-center">Apostas</span>
              <span className="text-center">Status</span>
              <span className="text-right">Ações</span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {rounds.map((round) => (
                <div
                  key={round.roundId}
                  className="grid grid-cols-5 gap-2 items-center p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <span className="text-sm font-mono text-slate-400 truncate">
                    #{round.roundId.substring(0, 8)}...
                  </span>

                  <div className="flex justify-center">
                    <span
                      className={cn(
                        "px-2 py-1 rounded-md text-sm font-bold font-mono",
                        getCrashColor(round.crashPoint),
                      )}
                    >
                      {round.crashPoint === "secret"
                        ? "--"
                        : `${round.crashPoint.toFixed(2)}x`}
                    </span>
                  </div>

                  <div className="text-center text-sm text-slate-400">
                    {round.bets?.length || 0}
                  </div>

                  <div className="flex justify-center">
                    {round.status === "crashed" ? (
                      <span className="text-green-500 text-xs px-2 py-1 rounded-full bg-green-500/10">
                        Finalizado
                      </span>
                    ) : (
                      <span className="text-yellow-500 text-xs px-2 py-1 rounded-full bg-yellow-500/10">
                        Em andamento
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <button
                      onClick={() => handleViewDetails(round)}
                      className="inline-flex items-center gap-1 text-xs text-yellow-500 hover:text-yellow-400 transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      Auditar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="text-sm text-slate-400">
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <RoundDetailsModal
        round={selectedRound}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
