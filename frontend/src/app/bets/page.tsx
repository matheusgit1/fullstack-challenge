import { BetsHistory } from "@/components/game/bets-history";
import { Header } from "@/components/layout/header";

export default async function BetsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">
              Meu Histórico de Apostas
            </h1>
            <p className="text-sm text-slate-400">
              Acompanhe todas as suas apostas, lucros e estatísticas
            </p>
          </div>

          <BetsHistory />
        </div>
      </div>
    </div>
  );
}
