// lib/hooks/useOptimizedFetch.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useOptimizedFetch<T>(
  key: string | string[],
  url: string,
  enabled: boolean = true
) {
  const queryClient = useQueryClient();

  return useQuery<T>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Request failed');
      return response.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // replaces cacheTime in v5
  });
}
