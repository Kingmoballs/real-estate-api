import { Suspense } from 'react'
import {
  Building2,
  CalendarCheck2,
  CalendarRange,
  LayoutDashboard,
  MessageCircle,
  MessageSquareText,
  Plus,
} from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import RouteLoadingFallback from '../routing/RouteLoadingFallback.jsx'

const workspaceLinks = [
  { to: '/agent', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/agent/properties', label: 'Properties', icon: Building2 },
  { to: '/agent/inspections', label: 'Inspections', icon: CalendarCheck2 },
  { to: '/agent/bookings', label: 'Bookings', icon: CalendarRange },
  { to: '/agent/reviews', label: 'Reviews', icon: MessageSquareText },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
]

function AgentWorkspaceShell() {
  return (
    <main className="page-shell py-6 sm:py-10">
      <section className="rounded-2xl bg-emerald-950 px-5 py-6 text-white sm:rounded-[2rem] sm:px-8 sm:py-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-200">
              Agent workspace
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-[-0.045em] sm:text-3xl">
              Manage your property business
            </h1>
          </div>
          <Link
            to="/agent/properties/new"
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-emerald-950 hover:bg-amber-400 sm:w-fit"
          >
            <Plus size={18} /> Add property
          </Link>
        </div>
      </section>

      <nav
        className="hide-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-1 overflow-x-auto border-b border-stone-200 px-4 sm:mx-0 sm:mt-5 sm:px-0"
        aria-label="Agent workspace"
      >
        {workspaceLinks.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              'focus-ring flex shrink-0 snap-start items-center gap-2 border-b-2 px-3 py-3 text-sm font-extrabold sm:px-4 ' +
              (isActive
                ? 'border-emerald-900 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800')
            }
          >
            <Icon size={17} /> {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-5 sm:mt-7">
        <Suspense fallback={<RouteLoadingFallback compact />}>
          <Outlet />
        </Suspense>
      </div>
    </main>
  )
}

export default AgentWorkspaceShell
