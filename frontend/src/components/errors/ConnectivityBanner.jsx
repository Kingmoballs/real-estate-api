import { RefreshCw, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

function ConnectivityBanner() {
  const [problem, setProblem] = useState(() =>
    navigator.onLine ? null : 'offline',
  )

  useEffect(() => {
    const handleOffline = () => setProblem('offline')
    const handleOnline = () => setProblem(null)
    const handleApiUnavailable = () => setProblem('api')
    const handleApiAvailable = () => {
      if (navigator.onLine) {
        setProblem(null)
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    window.addEventListener('haven:api-unavailable', handleApiUnavailable)
    window.addEventListener('haven:api-available', handleApiAvailable)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener(
        'haven:api-unavailable',
        handleApiUnavailable,
      )
      window.removeEventListener('haven:api-available', handleApiAvailable)
    }
  }, [])

  if (!problem) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-amber-950"
    >
      <div className="page-shell flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="flex items-start gap-2 text-sm font-bold leading-6">
          <WifiOff className="mt-0.5 shrink-0" size={17} />
          {problem === 'offline'
            ? 'You are offline. Check your internet connection and try again.'
            : 'Haven cannot reach the API right now. The service may be waking up; please try again shortly.'}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="focus-ring inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-amber-400 bg-white px-3 py-2 text-xs font-black"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    </div>
  )
}

export default ConnectivityBanner
