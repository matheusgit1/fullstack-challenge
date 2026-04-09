
import { BetsHistory } from "@/components/game/bets-history";
import { Header } from "@/components/layout/header";
import { UserBet } from "@/types/bet";

async function getInitialBets(): Promise<{
  bets: UserBet[];
  totalPages: number;
}> {
  try {
    const response = {
      success: true,
      data: {
        data: [
          {
            roundCrashPoint: 2.89,
            roundId: "df7255fc-602e-4809-ba82-2c79efeabb1a",
            id: "90d2dbf2-7d92-48d3-8e2e-f7040017cad9",
            userId: "328b5bea-d4f9-4a58-a504-5a12c2be5220",
            amount: 500,
            multiplier: 1.01,
            status: "cashed_out",
            cashedOutAt: "2026-04-09T17:49:28.706Z",
            createdAt: "2026-04-09T17:49:12.637Z",
          },
          {
            roundCrashPoint: 1.45,
            roundId: "d00cd9b2-ff81-47a5-a30e-d4b2ad320a33",
            id: "7c20730f-ee70-4936-92ea-18159c963c8d",
            userId: "328b5bea-d4f9-4a58-a504-5a12c2be5220",
            amount: 50000,
            multiplier: 1.02,
            status: "cashed_out",
            cashedOutAt: "2026-04-09T17:38:51.607Z",
            createdAt: "2026-04-09T17:38:13.394Z",
          },
          {
            roundCrashPoint: 1.97,
            roundId: "920acddd-f601-46d2-bb45-a291cb2ff44e",
            id: "3f2c9ac1-6326-4728-a646-0cac0cc656c2",
            userId: "328b5bea-d4f9-4a58-a504-5a12c2be5220",
            amount: 50000,
            multiplier: 1.24,
            status: "cashed_out",
            cashedOutAt: "2026-04-09T17:25:32.470Z",
            createdAt: "2026-04-09T17:22:24.736Z",
          },
          {
            roundCrashPoint: 8.29,
            roundId: "059f1e1f-8a1a-46e0-9cd8-6192bf50bba0",
            id: "24c8ec36-8dd7-4b59-83da-9423437974b8",
            userId: "328b5bea-d4f9-4a58-a504-5a12c2be5220",
            amount: 10000,
            multiplier: 1,
            status: "pending",
            cashedOutAt: "2026-04-09T01:30:49.064Z",
            createdAt: "2026-04-09T01:30:25.090Z",
          },
        ],
        page: 1,
        limit: 20,
        total: 4,
        totalPages: 1,
      },
      tracingId: "17807d0469040f5e58",
      timestamp: "2026-04-09T18:14:57.380Z",
    };
    const { data, success } = response;
    if (success) {
      return {
        bets: data.data,
        totalPages: data.totalPages,
      };
    }
  } catch (error) {
    console.error("Error fetching initial bets:", error);
  }

  return { bets: [], totalPages: 1 };
}

export default async function BetsPage() {
  const { bets, totalPages } = await getInitialBets();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">
              Meu Histórico de Apostas
            </h1>
            <p className="text-sm text-slate-400">
              Acompanhe todas as suas apostas, lucros e estatísticas
            </p>
          </div>

          <BetsHistory initialBets={bets} initialTotalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}
