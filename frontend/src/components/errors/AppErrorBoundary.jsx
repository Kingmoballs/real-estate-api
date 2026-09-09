import { Component } from 'react'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

const chunkErrorPattern =
  /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)

    this.state = {
      error: null,
      resetKey: 0,
    }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('The application could not render.', error, errorInfo)
  }

  handleRetry = () => {
    this.setState((state) => ({
      error: null,
      resetKey: state.resetKey + 1,
    }))
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    const { children } = this.props
    const { error, resetKey } = this.state

    if (!error) {
      return <div key={resetKey}>{children}</div>
    }

    const isChunkError = chunkErrorPattern.test(
      String(error?.message || error),
    )

    return (
      <main className="grid min-h-screen place-items-center bg-stone-50 px-5 py-12">
        <section
          role="alert"
          className="w-full max-w-xl rounded-[2rem] border border-stone-200 bg-white p-7 text-center shadow-xl shadow-stone-200/50 sm:p-10"
        >
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-800">
            <AlertTriangle size={26} />
          </span>

          <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">
            Haven needs a moment
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-stone-950">
            {isChunkError
              ? 'A newer version is available'
              : 'Something went wrong'}
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-stone-600">
            {isChunkError
              ? 'Refresh the page to load the latest version of the marketplace.'
              : 'We could not display this page. You can try again, reload the application, or return home.'}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {!isChunkError && (
              <button
                type="button"
                onClick={this.handleRetry}
                className="focus-ring inline-flex cursor-pointer items-center justify-center rounded-xl border border-stone-300 px-5 py-3 text-sm font-black text-stone-700"
              >
                Try again
              </button>
            )}

            <button
              type="button"
              onClick={this.handleReload}
              className="focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-3 text-sm font-black text-white"
            >
              <RefreshCw size={17} />
              Refresh page
            </button>

            <a
              href="/"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 px-5 py-3 text-sm font-black text-stone-700"
            >
              <Home size={17} />
              Return home
            </a>
          </div>
        </section>
      </main>
    )
  }
}

export default AppErrorBoundary
