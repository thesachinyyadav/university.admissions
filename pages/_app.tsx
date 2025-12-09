import '@/styles/globals.css'
import { useState, useEffect } from 'react'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { SWRConfig } from 'swr'
import Navbar from '@/components/Navbar'
import PWAProvider from '@/components/PWAProvider'
import LoadingScreen from '@/components/LoadingScreen'
import { ToastProvider } from '@/components/ui/Toast'
import { localCache } from '@/lib/hooks/useSWRCache'

// Global SWR configuration for performance
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  // Use local cache as fallback for offline support
  onErrorRetry: (error: any, key: string, config: any, revalidate: any, { retryCount }: { retryCount: number }) => {
    // Don't retry on 404 or 401
    if (error.status === 404 || error.status === 401) return
    // Only retry up to 3 times
    if (retryCount >= 3) return
    // Retry after 5 seconds
    setTimeout(() => revalidate({ retryCount }), 5000)
  },
  // Cache provider for persistence
  provider: () => {
    const map = new Map()
    
    // Restore cache from localStorage on init
    if (typeof window !== 'undefined') {
      try {
        const storedCache = localStorage.getItem('swr-cache')
        if (storedCache) {
          const parsed = JSON.parse(storedCache)
          Object.entries(parsed).forEach(([key, value]) => {
            map.set(key, value)
          })
        }
      } catch (e) {
        // Ignore cache restore errors
      }
      
      // Save cache to localStorage before unload
      window.addEventListener('beforeunload', () => {
        try {
          const cacheData: Record<string, any> = {}
          map.forEach((value, key) => {
            cacheData[key] = value
          })
          localStorage.setItem('swr-cache', JSON.stringify(cacheData))
        } catch (e) {
          // Ignore cache save errors
        }
      })
    }
    
    return map
  },
}

export default function App({ Component, pageProps }: AppProps) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Initial loading - 2000ms to ensure Socio branding visibility
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Show loading on route change
    const handleStart = () => setLoading(true)
    const handleComplete = () => setLoading(false)

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleComplete)
    router.events.on('routeChangeError', handleComplete)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleComplete)
      router.events.off('routeChangeError', handleComplete)
    }
  }, [router])

  const showNavbar = router.pathname !== '/display-board';

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        <link rel="preconnect" href="https://mzrfwdjapeoiqgvtifkc.supabase.co" />
        <link rel="dns-prefetch" href="https://mzrfwdjapeoiqgvtifkc.supabase.co" />
      </Head>
      <SWRConfig value={swrConfig}>
        <PWAProvider>
          <ToastProvider>
            {loading && <LoadingScreen />}
            {showNavbar && <Navbar />}
            <Component {...pageProps} />
          </ToastProvider>
        </PWAProvider>
      </SWRConfig>
    </>
  )
}
