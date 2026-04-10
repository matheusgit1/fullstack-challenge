import { RoundsList } from "@/components/game/rounds-list";
import { Header } from "@/components/layout/header";


export default async function RoundsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Auditoria de Rodadas
              </h1>
              <p className="text-sm text-slate-400">
                Verifique validade de todas as rodadas e apostas
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="text-xs text-yellow-500">Provably Fair</span>
            </div>
          </div>

          <RoundsList initialRounds={[]} />
        </div>
      </div>
    </div>
  );
}
