function RouteLoadingFallback({ compact = false }) {
  return (
    <div
      className={
        compact
          ? 'py-10'
          : 'page-shell py-10 sm:py-14'
      }
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="animate-pulse space-y-5">
        <div className="h-3 w-28 rounded-full bg-stone-200" />
        <div className="h-9 w-full max-w-md rounded-xl bg-stone-200" />
        <div className="h-4 w-full max-w-2xl rounded-full bg-stone-100" />
        <div className="grid gap-5 pt-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-64 rounded-2xl border border-stone-100 bg-stone-100"
            />
          ))}
        </div>
      </div>

      <span className="sr-only">Loading page…</span>
    </div>
  )
}

export default RouteLoadingFallback
