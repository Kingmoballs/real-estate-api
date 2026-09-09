import { Suspense } from 'react'
import {
  Building2,
  CalendarCheck2,
  CalendarRange,
  ClipboardCheck,
  MessageSquareText,
  ShieldCheck,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import RouteLoadingFallback from '../routing/RouteLoadingFallback.jsx'

const workspaceLinks = [
  {
    to: '/admin',
    label: 'Agent applications',
    icon: ClipboardCheck,
    end: true,
  },
  {
    to: '/admin/properties',
    label: 'Property approvals',
    icon: Building2,
  },
  {
    to: '/admin/reviews',
    label: 'Customer reviews',
    icon: MessageSquareText,
  },
  {
    to: '/admin/inspections',
    label: 'Inspections',
    icon: CalendarCheck2,
  },
  {
    to: '/admin/bookings',
    label: 'Bookings',
    icon: CalendarRange,
  },
]

function AdminWorkspaceShell() {
  return (
    <main className="page-shell py-6 sm:py-10">
      <section className="rounded-2xl bg-stone-950 px-5 py-6 text-white sm:rounded-[2rem] sm:px-8 sm:py-7">
        <div className="flex items-center gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 sm:size-12">
            <ShieldCheck size={23} />
          </span>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-300">
              Platform administration
            </p>

            <h1 className="mt-2 text-2xl font-black tracking-[-0.045em] sm:text-3xl">
              Operate and moderate Haven
            </h1>
          </div>
        </div>
      </section>

      <nav
        className="hide-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-1 overflow-x-auto border-b border-stone-200 px-4 sm:mx-0 sm:mt-5 sm:px-0"
        aria-label="Administrator workspace"
      >
        {workspaceLinks.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              'focus-ring flex shrink-0 snap-start items-center gap-2 border-b-2 px-3 py-3 text-sm font-extrabold sm:px-4 ' +
              (isActive
                ? 'border-stone-950 text-stone-950'
                : 'border-transparent text-stone-500 hover:text-stone-800')
            }
          >
            <Icon size={17} />
            {label}
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

export default AdminWorkspaceShell
