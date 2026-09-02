import { ArrowRight, LayoutDashboard } from 'lucide-react'
import { Link } from 'react-router-dom'

function DashboardPlaceholder({ eyebrow, title, description }) {
  return (
    <main className="page-shell py-14 sm:py-20">
      <section className="overflow-hidden rounded-[2rem] bg-emerald-950 text-white">
        <div className="max-w-3xl px-7 py-14 sm:px-12 sm:py-20">
          <span className="mb-6 grid size-12 place-items-center rounded-xl bg-emerald-800">
            <LayoutDashboard size={23} />
          </span>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-400">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl leading-7 text-emerald-100/70">{description}</p>
          <Link
            to="/properties"
            className="focus-ring mt-8 flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-emerald-950"
          >
            Explore properties <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  )
}

export default DashboardPlaceholder
