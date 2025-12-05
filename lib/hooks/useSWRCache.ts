import useSWR, { SWRConfiguration, mutate } from 'swr';

// Global fetcher with error handling
const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  
  return res.json();
};

// Default SWR options for performance
const defaultOptions: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // Dedupe requests within 5 seconds
  errorRetryCount: 3,
  errorRetryInterval: 5000,
};

// Hook for fetching lobby status with caching
export function useLobbyStatus(refreshInterval = 5000) {
  return useSWR('/api/lobby/status', fetcher, {
    ...defaultOptions,
    refreshInterval,
  });
}

// Hook for fetching batch history with caching
export function useBatchHistory(lobbyName: string, refreshInterval = 5000) {
  return useSWR(
    lobbyName ? `/api/lobby/batch-history?lobby_name=${encodeURIComponent(lobbyName)}` : null,
    fetcher,
    {
      ...defaultOptions,
      refreshInterval,
    }
  );
}

// Hook for fetching visitors with caching and pagination
export function useVisitors(page = 1, limit = 50, eventId?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (eventId) params.append('event_id', eventId);
  
  return useSWR(`/api/visitors?${params.toString()}`, fetcher, {
    ...defaultOptions,
    revalidateOnFocus: true,
  });
}

// Hook for fetching approved events with caching
export function useApprovedEvents() {
  return useSWR('/api/approved-events', fetcher, {
    ...defaultOptions,
    revalidateOnFocus: true,
    dedupingInterval: 30000, // Events don't change often
  });
}

// Hook for fetching event requests with caching
export function useEventRequests(organiserId?: string) {
  const url = organiserId 
    ? `/api/event-requests?organiser_id=${organiserId}`
    : '/api/event-requests';
    
  return useSWR(url, fetcher, {
    ...defaultOptions,
    revalidateOnFocus: true,
  });
}

// Hook for analytics data with caching
export function useAnalytics(refreshInterval = 30000) {
  return useSWR('/api/analytics', fetcher, {
    ...defaultOptions,
    refreshInterval,
    dedupingInterval: 10000,
  });
}

// Hook for CSO notifications
export function useCSONotifications(refreshInterval = 10000) {
  return useSWR('/api/cso/notifications', fetcher, {
    ...defaultOptions,
    refreshInterval,
  });
}

// Manual cache invalidation helpers
export const invalidateCache = {
  lobbyStatus: () => mutate('/api/lobby/status'),
  batchHistory: (lobbyName: string) => 
    mutate(`/api/lobby/batch-history?lobby_name=${encodeURIComponent(lobbyName)}`),
  visitors: () => mutate((key: string) => typeof key === 'string' && key.startsWith('/api/visitors'), undefined, { revalidate: true }),
  approvedEvents: () => mutate('/api/approved-events'),
  eventRequests: () => mutate((key: string) => typeof key === 'string' && key.startsWith('/api/event-requests'), undefined, { revalidate: true }),
  analytics: () => mutate('/api/analytics'),
  csoNotifications: () => mutate('/api/cso/notifications'),
  all: () => mutate(() => true, undefined, { revalidate: true }),
};

// Local storage cache for offline support
const CACHE_PREFIX = 'cugate_cache_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const localCache = {
  set: (key: string, data: any) => {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheItem));
    } catch (e) {
      console.warn('Failed to cache data:', e);
    }
  },
  
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key);
      if (!item) return null;
      
      const cacheItem = JSON.parse(item);
      const isExpired = Date.now() - cacheItem.timestamp > CACHE_EXPIRY;
      
      if (isExpired) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      
      return cacheItem.data as T;
    } catch (e) {
      return null;
    }
  },
  
  clear: (key?: string) => {
    if (key) {
      localStorage.removeItem(CACHE_PREFIX + key);
    } else {
      // Clear all cache items
      Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_PREFIX))
        .forEach(k => localStorage.removeItem(k));
    }
  },
};

export { fetcher, defaultOptions };
