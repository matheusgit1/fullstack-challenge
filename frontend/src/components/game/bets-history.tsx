
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  History, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { BetsApiResponse, UserBet } from "@/types/bet";
// import type { UserBet, BetsApiResponse } from "@/types/bets.types";

interface BetsHistoryProps {
  initialBets?: UserBet[];
  initialTotalPages?: number;
  userId?: string; // Opcional: para filtrar por usuário específico
}

export function BetsHistory({ initialBets = [], initialTotalPages = 1, userId }: BetsHistoryProps) {
  const [bets, setBets] = useState<UserBet[]>(initialBets);
  const [loading, setLoading] = useState(!initialBets.length);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const betsPerPage = 20;

  useEffect(() => {
    if (!initialBets.length) {
      fetchBets();
    }
  }, [currentPage, userId]);

  const fetchBets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = userId 
        ? `/api/bets?page=${currentPage}&limit=${betsPerPage}&userId=${userId}`
        : `/api/bets?page=${currentPage}&limit=${betsPerPage}`;
      
      const response = await fetch(url);
      const data: BetsApiResponse = await response.json();
      
      if (data.success) {
        setBets(data.data.data);
        setTotalPages(data.data.totalPages);
        setTotal(data.data.total);
      } else {
        throw new Error("Falha ao carregar apostas");
      }
    } catch (err) {
      console.error("Error fetching bets:", err);
      setError("Falha ao carregar histórico de apostas");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string, multiplier: number) => {
    if (status === "cashed_out") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (status === "lost") {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "cashed_out":
        return "Sacado";
      case "lost":
        return "Perdeu";
      case "pending":
        return "Pendente";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "cashed_out":
        return "text-green-500 bg-green-500/10";
      case "lost":
        return "text-red-500 bg-red-500/10";
      case "pending":
        return "text-yellow-500 bg-yellow-500/10";
      default:
        return "text-slate-500 bg-slate-500/10";
    }
  };

  const getCrashColor = (crashPoint: number) => {
    if (crashPoint <= 1.5) return "text-red-500 bg-red-500/10";
    if (crashPoint <= 3) return "text-orange-500 bg-orange-500/10";
    if (crashPoint <= 5) return "text-yellow-500 bg-yellow-500/10";
    return "text-green-500 bg-green-500/10";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateProfit = (bet: UserBet) => {
    if (bet.status === "cashed_out") {
      return bet.amount * bet.multiplier - bet.amount;
    }
    if (bet.status === "lost") {
      return -bet.amount;
    }
    return null;
  };

  // Estatísticas
  const totalBetsAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
  const totalProfit = bets.reduce((sum, bet) => {
    const profit = calculateProfit(bet);
    return sum + (profit || 0);
  }, 0);
  const successRate = bets.filter(b => b.status === "cashed_out").length / bets.length * 100;

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

  if (error) {
    return (
      <Card className="bg-slate-900/50 border-red-500/30">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-2 text-red-500">
            <AlertCircle className="h-8 w-8" />
            <p>{error}</p>
            <button
              onClick={fetchBets}
              className="mt-2 px-4 py-2 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">Total Apostado</p>
                <p className="text-2xl font-bold text-white">
                  {totalBetsAmount.toFixed(2)} APT
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">Lucro/Prejuízo</p>
                <p className={cn(
                  "text-2xl font-bold",
                  totalProfit >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {totalProfit >= 0 ? "+" : ""}{totalProfit.toFixed(2)} APT
                </p>
              </div>
              <TrendingUp className={cn(
                "h-8 w-8 opacity-50",
                totalProfit >= 0 ? "text-green-500" : "text-red-500"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">Taxa de Acerto</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {successRate.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {bets.filter(b => b.status === "cashed_out").length} / {bets.length} apostas
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bets Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-slate-400" />
            Histórico de Apostas
            {total > 0 && (
              <span className="text-sm font-normal text-slate-500">
                ({total} apostas)
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-2 text-xs text-slate-500 pb-2 border-b border-slate-800">
              <span>Rodada</span>
              <span className="text-center">Crash Point</span>
              <span className="text-right">Valor</span>
              <span className="text-right">Multiplicador</span>
              <span className="text-right">Retorno</span>
              <span className="text-center">Status</span>
            </div>

            {/* Bets List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {bets.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Nenhuma aposta encontrada
                </div>
              ) : (
                bets.map((bet) => {
                  const profit = calculateProfit(bet);
                  const payout = bet.status === "cashed_out" 
                    ? bet.amount * bet.multiplier 
                    : 0;
                  
                  return (
                    <div
                      key={bet.id}
                      className="grid grid-cols-6 gap-2 items-center p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Round ID */}
                      <span className="text-sm font-mono text-slate-400 truncate" title={bet.roundId}>
                        #{bet.roundId.substring(0, 8)}...
                      </span>

                      {/* Crash Point */}
                      <div className="flex justify-center">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-md text-sm font-bold font-mono",
                            getCrashColor(bet.roundCrashPoint)
                          )}
                        >
                          {bet.roundCrashPoint.toFixed(2)}x
                        </span>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <span className="text-sm font-mono text-white">
                          {bet.amount.toFixed(2)} APT
                        </span>
                      </div>

                      {/* Multiplier */}
                      <div className="text-right">
                        <span className="text-sm font-mono text-yellow-500">
                          {bet.multiplier.toFixed(2)}x
                        </span>
                      </div>

                      {/* Payout/Profit */}
                      <div className="text-right">
                        {bet.status === "cashed_out" ? (
                          <div>
                            <span className="text-sm font-mono text-green-500">
                              +{profit?.toFixed(2)} APT
                            </span>
                            <span className="text-xs text-slate-500 ml-1">
                              ({payout.toFixed(2)})
                            </span>
                          </div>
                        ) : bet.status === "lost" ? (
                          <span className="text-sm font-mono text-red-500">
                            {profit?.toFixed(2)} APT
                          </span>
                        ) : (
                          <span className="text-sm font-mono text-yellow-500">
                            Pendente
                          </span>
                        )}
                      </div>

                      {/* Status */}
                      <div className="flex justify-center">
                        <div className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                          getStatusColor(bet.status)
                        )}>
                          {getStatusIcon(bet.status, bet.multiplier)}
                          <span>{getStatusText(bet.status)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-sm transition-colors",
                          currentPage === pageNum
                            ? "bg-yellow-500 text-slate-900 font-bold"
                            : "bg-slate-800/50 text-slate-400 hover:text-yellow-500"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Info Footer */}
            <div className="text-xs text-slate-500 text-right pt-2">
              Mostrando {bets.length} de {total} apostas
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}