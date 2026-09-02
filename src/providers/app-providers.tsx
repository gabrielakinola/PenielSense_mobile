import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/src/theme/theme-provider';
import { OfflineSyncProvider } from '@/src/offline/OfflineSyncProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <OfflineSyncProvider>{children}</OfflineSyncProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
