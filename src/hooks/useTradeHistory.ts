import { useGetTradeHistory } from "@/services/api/endpoints/trading/trading";

export function useTradeHistory() {
  // By default, Orval's useGetTradeHistory returns a React Query object.
  // We don't pass any arguments as it doesn't take parameters yet.
  return useGetTradeHistory({
    query: {
      staleTime: 5000, // cache for 5 seconds to prevent spamming
      refetchOnWindowFocus: true,
    }
  });
}
