// frontend/src/components/game/RoundHistory.tsx

import { useGameStore } from '@/stores/game-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dados mockados para histórico
const mockHistory = [
  { roundId: '1', crashPoint: 1.23, serverSeedHash: 'abc123...', verified: true },
  { roundId: '2', crashPoint: 2.45, serverSeedHash: 'def456...', verified: true },
  { roundId: '3', crashPoint: 5.67, serverSeedHash: 'ghi789...', verified: false },
  { roundId: '4', crashPoint: 1.02, serverSeedHash: 'jkl012...', verified: true },
  { roundId: '5', crashPoint: 3.33, serverSeedHash: 'mno345...', verified: true },
  { roundId: '6', crashPoint: 8.88, serverSeedHash: 'pqr678...', verified: true },
  { roundId: '7', crashPoint: 1.55, serverSeedHash: 'stu901...', verified: false },
  { roundId: '8', crashPoint: 4.20, serverSeedHash: 'vwx234...', verified: true },
];

export function RoundHistory() {
  // TODO: Substituir por dados reais da API
  const history = mockHistory;
  
  const getCrashColor = (crashPoint: number) => {
    if (crashPoint < 1.5) return 'text-red-500 bg-red-500/10';
    if (crashPoint < 3) return 'text-orange-500 bg-orange-500/10';
    if (crashPoint < 5) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-green-500 bg-green-500/10';
  };
  
  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-slate-400" />
          Últimas Rodadas
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-4 gap-2 text-xs text-slate-500 pb-2 border-b border-slate-800">
            <span>Rodada</span>
            <span className="text-center">Crash</span>
            <span className="text-center">Verificação</span>
            <span className="text-right"></span>
          </div>
          
          {/* Lista de rodadas */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {history.map((round, index) => (
              <div
                key={round.roundId}
                className="grid grid-cols-4 gap-2 items-center p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <span className="text-sm font-mono text-slate-400">
                  #{history.length - index}
                </span>
                
                <div className="flex justify-center">
                  <span className={cn(
                    "px-2 py-1 rounded-md text-sm font-bold font-mono",
                    getCrashColor(round.crashPoint)
                  )}>
                    {round.crashPoint.toFixed(2)}x
                  </span>
                </div>
                
                <div className="flex justify-center">
                  {round.verified ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                
                <div className="text-right">
                  <button
                    className="text-xs text-slate-500 hover:text-yellow-500 transition-colors"
                    onClick={() => {
                      // TODO: Abrir modal com verificação provably fair
                      console.log('Verificar rodada', round.roundId);
                    }}
                  >
                    Verificar
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Link para mais histórico */}
          <div className="pt-3 text-center">
            <button className="text-sm text-yellow-500 hover:text-yellow-400 transition-colors">
              Ver todas as rodadas →
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}