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
    <main className="page-shell py-8 sm:py-10">
      <section className="rounded-[2rem] bg-emerald-950 px-6 py-7 text-white sm:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-200">
              Agent workspace
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.045em]">
              Manage your property business
            </h1>
          </div>
          <Link
            to="/agent/properties/new"
            className="focus-ring flex w-fit items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-emerald-950 hover:bg-amber-400"
          >
            <Plus size={18} /> Add property
          </Link>
        </div>
      </section>

      <nav
        className="mt-5 flex gap-1 overflow-x-auto border-b border-stone-200"
        aria-label="Agent workspace"
      >
        {workspaceLinks.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              'focus-ring flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-extrabold ' +
              (isActive
                ? 'border-emerald-900 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800')
            }
          >
            <Icon size={17} /> {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-7">
        <Outlet />
      </div>
    </main>
  )
}

export default AgentWorkspaceShell
