import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main className="page-shell grid min-h-[65vh] place-items-center py-16 text-center">
      <div>
        <p className="eyebrow">404 — Page not found</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-stone-900 sm:text-5xl">
          This address has no listing.
        </h1>
        <p className="mx-auto mt-4 max-w-lg leading-7 text-stone-500">
          The page may have moved, or the link may be incorrect.
        </p>
        <Link
          to="/"
          className="focus-ring mx-auto mt-7 flex w-fit items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-black text-white"
        >
          <ArrowLeft size={17} /> Return home
        </Link>
      </div>
    </main>
  )
}

export default NotFoundPage
