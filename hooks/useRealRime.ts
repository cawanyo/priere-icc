// hooks/useRealtime.ts
import { useQuery } from "@tanstack/react-query";

interface UseRealtimeOptions<T> {
  queryKey: string[];
  initialData: T;
  fetcher: () => Promise<{ success: boolean; data?: T; error?: string }>;
  refetchInterval?: number; // Par défaut 5000ms (5s)
}

export function useRealtime<T>({ 
  queryKey, 
  initialData, 
  fetcher, 
  refetchInterval = 5000 
}: UseRealtimeOptions<T>) {
  
  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetcher();
      if (!res.success || !res.data) throw new Error(res.error);
      return res.data;
    },
    // Utiliser les données initiales du serveur pour un affichage immédiat (Hydratation)
    initialData,
    // Rafraîchir périodiquement (Polling)
    refetchInterval,
    // Rafraîchir aussi quand l'utilisateur revient sur la fenêtre
    refetchOnWindowFocus: true,
  });

  return data;
}