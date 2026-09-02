import {
  Building2,
  CalendarCheck2,
  CalendarRange,
  ClipboardCheck,
  MessageSquareText,
  ShieldCheck,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

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
    <main className="page-shell py-8 sm:py-10">
      <section className="rounded-[2rem] bg-stone-950 px-6 py-7 text-white sm:px-8">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-xl bg-white/10">
            <ShieldCheck size={23} />
          </span>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-300">
              Platform administration
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.045em]">
              Operate and moderate Haven
            </h1>
          </div>
        </div>
      </section>

      <nav
        className="mt-5 flex gap-1 overflow-x-auto border-b border-stone-200"
        aria-label="Administrator workspace"
      >
        {workspaceLinks.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              'focus-ring flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-extrabold ' +
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

      <div className="mt-7">
        <Outlet />
      </div>
    </main>
  )
}

export default AdminWorkspaceShell