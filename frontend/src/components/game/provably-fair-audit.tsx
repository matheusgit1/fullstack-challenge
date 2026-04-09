"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Hash,
  Calculator,
  TrendingUp,
  AlertCircle,
  Key,
  RefreshCw,
  Lock,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { apiFetch } from "@/app/lib/api";

export interface ProvablyFairAuditResponse {
  success: boolean;
  data: ProvablyFairData;
  tracingId: string;
  timestamp: string;
}

export interface ProvablyFairData {
  fairId: string;
  serverSeed: string | "secret";
  serverSeedHash: string | "secret";
  clientSeed: string | "secret";
  nonce: number;
  isValid: boolean | null;
  realCrashPoint: number | "secret" | null;
  maxMultiplierReached: number;
  deviation: number | "secret" | null;
  houseEdgePercent: number;
  formula: string;
  round: RoundAuditInfo;
  timing: TimingAuditInfo;
  deterministicCheck: DeterministicCheck;
}

export interface RoundAuditInfo {
  roundId: string;
  status: string;
  crashPoint: number | "secret" | null;
  multiplier: number | null;
  roundStartedAt: string;
  roundCrashedAt: string | null | "secret";
  serverSeedHash: string | null | "secret";
  bettingEndsAt: string | null;
  bettingStartedAt: string | null;
  createdAt: string;
  updatedAt: string;
  endedAt: string | null | "secret";
  // bets: any[]; //não preciso das bets aqui
  totalAmount: number;
  totalBets: number;
}

export interface TimingAuditInfo {
  startedAt: string | null;
  crashedAt: string | null;
  roundDurationMs: number | null;
  roundDurationSeconds: number | null;
  estimatedCrashDurationMs: number | null;
  estimatedCrashDurationSeconds: number | null;
  timingDriftMs: number | null;
  timingIsConsistent: boolean;
  theoreticalMaxMultiplierAtCrash: number | null;
  maxMultiplierDeviation: number | null;
  earlyTermination: boolean;
}

export interface DeterministicCheck {
  seedIsUnused: boolean;
  resultIsRepeatable: boolean;
  verificationHash: string;
}
// Helper functions para lidar com valores secret
const isSecret = (value: any): boolean => value === "secret";
const isPending = (value: any): boolean => value === "pending";

const formatValue = (
  value: any,
  options?: { fallback?: string; unit?: string; decimals?: number },
): string => {
  if (isSecret(value)) return "🔒 Aguardando crash";
  if (isPending(value)) return "⏳ Pendente";
  if (value === null || value === undefined)
    return options?.fallback || "❓ Indisponível";
  if (typeof value === "number") {
    const decimals = options?.decimals ?? 2;
    return `${value.toFixed(decimals)}${options?.unit || ""}`;
  }
  return String(value);
};

interface ProvablyFairAuditProps {
  roundId: string;
  roundStatus?: string;
  roundCrashPoint?: number | string;
  roundMultiplier?: number;
}

export function ProvablyFairAudit({
  roundId,
  roundStatus,
}: ProvablyFairAuditProps) {
  const [auditData, setAuditData] = useState<ProvablyFairData | null>(null);
  const [tracingId, setTracingId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSeeds, setShowSeeds] = useState(false);
  const [showFormula, setShowFormula] = useState(false);

  const isRoundRunning = roundStatus === "running";

  useEffect(() => {
    fetchAuditData();
  }, [roundId]);

  const fetchAuditData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { response } = await apiFetch<ProvablyFairData>(
        "game",
        `/games/rounds/${roundId}/verify`,
      );

      if (!response.success) throw new Error(response.error.message);

      const data = response.data;

      setAuditData(() => data);
      setTracingId(() => response.tracingId);
    } catch (err) {
      console.error("Error fetching audit data:", err);
      setError("Falha ao carregar dados de auditoria");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            <p className="text-sm text-slate-400">
              Verificando provably fair...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !auditData) {
    return (
      <Card className="bg-slate-800/50 border-red-500/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error || "Erro ao carregar auditoria"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isValid = auditData.isValid;
  const isTimingConsistent = auditData.timing.timingIsConsistent;
  const isEarlyTermination = auditData.timing.earlyTermination;

  const getValidationStatus = () => {
    if (isRoundRunning) {
      return {
        type: "info",
        title: "⏳ Rodada em Andamento",
        description:
          "As informações completas serão reveladas após o crash da rodada",
        icon: Clock,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
      };
    }

    if (isValid && isTimingConsistent && !isEarlyTermination) {
      return {
        type: "success",
        title: "✓ Rodada Verificada",
        description: "Todos os checks de integridade foram aprovados",
        icon: Shield,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
      };
    }

    return {
      type: "error",
      title: "⚠️ Inconsistência Detectada",
      description: "Esta rodada apresenta inconsistências que merecem atenção",
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    };
  };

  const validationStatus = getValidationStatus();
  const ValidationIcon = validationStatus.icon;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "p-4 rounded-lg border-2",
          validationStatus.bgColor,
          validationStatus.borderColor,
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ValidationIcon className={cn("h-6 w-6", validationStatus.color)} />
            <div>
              <h4 className="font-semibold text-white">
                {validationStatus.title}
              </h4>
              <p className="text-xs text-slate-400">
                {validationStatus.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isRoundRunning && (
              <button
                onClick={fetchAuditData}
                className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
                title="Re-verificar"
              >
                <RefreshCw className="h-4 w-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-4 w-4 text-yellow-500" />
            <h4 className="font-semibold text-sm">Validação do Crash Point</h4>
            {isRoundRunning && (
              <span className="ml-2 text-xs text-yellow-500 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Revelado após o crash
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">Calculado</div>
              <div className="text-2xl font-bold text-blue-400">
                {formatValue(auditData.realCrashPoint, {
                  unit: "x",
                  decimals: 2,
                })}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Real</div>
              <div className="text-2xl font-bold text-white">
                {formatValue(auditData.realCrashPoint, {
                  unit: "x",
                  decimals: 2,
                  fallback: "Aguardando...",
                })}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Desvio</div>
              <div
                className={cn(
                  "text-2xl font-bold",
                  !isSecret(auditData.deviation) &&
                    auditData.deviation !== null &&
                    typeof auditData.deviation === "number" &&
                    auditData.deviation < 0.01
                    ? "text-green-500"
                    : "text-slate-400",
                )}
              >
                {formatValue(auditData.deviation, {
                  decimals: 4,
                  fallback: "N/A",
                })}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">House Edge:</span>
                <span className="text-sm font-mono text-yellow-500">
                  {auditData.houseEdgePercent}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Max Multiplier:</span>
                <span className="text-sm font-mono text-white">
                  {auditData.maxMultiplierReached.toFixed(2)}x
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-yellow-500" />
            <h4 className="font-semibold text-sm">Análise de Timing</h4>
            {isRoundRunning && (
              <span className="ml-2 text-xs text-yellow-500 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Disponível após o crash
              </span>
            )}
          </div>

          {isRoundRunning ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Lock className="h-12 w-12 text-slate-600 mb-3" />
              <p className="text-sm text-slate-400">
                Os dados de timing serão revelados após o crash da rodada
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Isso garante que ninguém possa prever o momento exato do crash
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-400 mb-2">
                    Duração da Rodada
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Real:</span>
                      <span className="text-sm font-mono text-white">
                        {auditData.timing.roundDurationSeconds?.toFixed(2) ??
                          "N/A"}
                        s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Estimado:</span>
                      <span className="text-sm font-mono text-white">
                        {auditData.timing.estimatedCrashDurationSeconds?.toFixed(
                          2,
                        ) ?? "N/A"}
                        s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Drift:</span>
                      <span
                        className={cn(
                          "text-sm font-mono",
                          auditData.timing.timingDriftMs &&
                            auditData.timing.timingDriftMs >= 0
                            ? "text-green-500"
                            : "text-red-500",
                        )}
                      >
                        {auditData.timing.timingDriftMs ?? "N/A"}ms
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 mb-2">
                    Consistência
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Timing Consistente:
                      </span>
                      {auditData.timing.timingIsConsistent ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Early Termination:
                      </span>
                      {auditData.timing.earlyTermination ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Max Multiplier Deviation:
                      </span>
                      <span className="text-sm font-mono text-yellow-500">
                        {auditData.timing.maxMultiplierDeviation?.toFixed(2) ??
                          "N/A"}
                        x
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {auditData.timing.earlyTermination && (
                <div className="mt-3 p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <p className="text-xs text-red-400">
                      ⚠️ CRÍTICO: A rodada crashou antes do tempo previsto pelas
                      seeds! Isso pode indicar manipulação do resultado.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-yellow-500" />
              <h4 className="font-semibold text-sm">Seeds e Hashes</h4>
            </div>
            {!isRoundRunning && (
              <button
                onClick={() => setShowSeeds(!showSeeds)}
                className="text-xs text-yellow-500 hover:text-yellow-400"
              >
                {showSeeds ? "Ocultar Seeds" : "Mostrar Seeds"}
              </button>
            )}
          </div>

          <div className="space-y-2 text-xs font-mono break-all">
            <div>
              <span className="text-slate-400">
                Server Seed Hash (Pré-jogo):
              </span>
              <div className="text-slate-300 bg-slate-900/50 p-2 rounded mt-1">
                {isSecret(auditData.serverSeedHash) ? (
                  <span className="flex items-center gap-2">
                    <Lock className="h-3 w-3" />
                    Hash disponível após o crash
                  </span>
                ) : (
                  auditData.serverSeedHash
                )}
              </div>
            </div>

            {!isRoundRunning && showSeeds && (
              <>
                <div>
                  <span className="text-slate-400">
                    Server Seed (Revelada):
                  </span>
                  <div className="text-green-400 bg-slate-900/50 p-2 rounded mt-1">
                    {auditData.serverSeed}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Client Seed:</span>
                  <div className="text-blue-400 bg-slate-900/50 p-2 rounded mt-1">
                    {auditData.clientSeed}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Nonce:</span>
                  <div className="text-purple-400 bg-slate-900/50 p-2 rounded mt-1">
                    {auditData.nonce}
                  </div>
                </div>
              </>
            )}

            {isRoundRunning && !showSeeds && (
              <div className="flex items-center justify-center py-4 text-center">
                <p className="text-xs text-slate-500">
                  As seeds completas serão reveladas após o crash da rodada
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="h-4 w-4 text-yellow-500" />
            <h4 className="font-semibold text-sm">
              Verificação Determinística
            </h4>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Seed Não Utilizada:
              </span>
              {auditData.deterministicCheck.seedIsUnused ? (
                <span className="text-xs text-green-500">
                  Disponível para pré-auditoria
                </span>
              ) : (
                <span className="text-xs text-slate-500">Já utilizada</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Resultado Repetível:
              </span>
              {auditData.deterministicCheck.resultIsRepeatable ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div>
              <span className="text-xs text-slate-400">Verification Hash:</span>
              <div className="text-xs font-mono text-slate-500 bg-slate-900/50 p-2 rounded mt-1 break-all">
                {auditData.deterministicCheck.verificationHash}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-yellow-500" />
              <h4 className="font-semibold text-sm">Fórmula de Cálculo</h4>
            </div>
            {!isRoundRunning && (
              <button
                onClick={() => setShowFormula(!showFormula)}
                className="text-xs text-yellow-500 hover:text-yellow-400"
              >
                {showFormula ? "Ocultar" : "Ver Fórmula"}
              </button>
            )}
          </div>

          {isRoundRunning ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Lock className="h-10 w-10 text-slate-600 mb-2" />
              <p className="text-sm text-slate-400">
                A fórmula completa será revelada após o crash
              </p>
            </div>
          ) : (
            showFormula && (
              <pre className="text-xs font-mono text-slate-300 bg-slate-900/50 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                {auditData.formula}
              </pre>
            )
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-slate-500 text-right pt-2">
        <div>Tracing ID: {tracingId}</div>
        <div>Verificado em: {new Date().toLocaleString()}</div>
      </div>
    </div>
  );
}
