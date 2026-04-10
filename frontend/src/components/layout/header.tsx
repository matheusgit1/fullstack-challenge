"use client";
import { useGameStore } from "@/stores/game-store";
import { Button } from "@/components/ui/button";
import { Coins, User, LogOut } from "lucide-react";
import { useLogout } from "@/functions/logout";
import { useRouter } from "next/navigation";

export function Header() {
  const { user } = useGameStore();
  const router = useRouter();
  const logout = useLogout();

  const handleLogout = async () => {
    try {
      await logout();
      console.log("Logout successful");
    } catch (error) {
      console.warn("Logout failed:", error);
    } finally {
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div
            className="flex items-center gap-2 hover:zoom-in hover:scale-110 transition-all"
            style={{ cursor: "pointer" }}
            onClick={() => router.push("/")}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg" />
            <span className="font-bold text-xl bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
              Crash Game
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="font-bold text-green-500">
                  R$ {user?.balance.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <User className="h-4 w-4" />
                <span>{user?.username}</span>
              </div>

              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-slate-400"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// export const Header = memo(GameHeader);
