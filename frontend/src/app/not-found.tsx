// app/not-found.tsx
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-8xl font-bold text-slate-700">404</div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">
            Página não encontrada
          </h1>
          <p className="text-slate-400 text-sm">
            A página que você procura não existe ou foi movida.
          </p>
        </div>

        <a
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 text-slate-900 font-semibold hover:bg-yellow-400 transition-colors"
        >
          <Home className="h-4 w-4" />
          Voltar ao início
        </a>
      </div>
    </div>
  );
}
