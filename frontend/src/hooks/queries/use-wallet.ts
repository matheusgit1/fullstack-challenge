import { useQuery } from "@tanstack/react-query";
import { Wallet } from "@/types/wallet";
import { ApiResponse } from "@/types/api";
import { queryKeys } from "@/app/lib/query-keys";
import { apiFetch } from "@/app/lib/api";

export function useWallet() {
  return useQuery({
    queryKey: queryKeys.wallet.me,
    queryFn: async () => {
      const { response } = await apiFetch<Wallet>("/wallets/me");

      if (!response.success) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    staleTime: 1000 * 30,
  });
}
