import {
  AlertTriangle,
  Building2,
  CalendarRange,
  Plus,
  WalletCards,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatMoney } from '../../features/activity/activityFormatters.js'
import { useAgentDashboard } from '../../features/agent/agentDashboardApi.js'
import { getApiErrorMessage } from '../../lib/errors.js'

const ranges = [
  ['today', 'Today'],
  ['7days', '7 days'],
  ['30days', '30 days'],
]

function AgentDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const range = searchParams.get('range') || '30days'
  const { data, error, isError, isLoading, refetch } =
    useAgentDashboard(range)

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl border border-stone-200 bg-white"
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertTriangle className="mx-auto text-red-700" size={28} />
        <p className="mt-3 text-sm font-semibold text-red-700">
          {getApiErrorMessage(error, 'Unable to load your dashboard.')}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="focus-ring mt-4 cursor-pointer rounded-lg bg-emerald-950 px-4 py-2 text-xs font-black text-white"
        >
          Try again
        </button>
      </div>
    )
  }

  const summary = data?.summary || {}
  const cards = [
    {
      label: 'Total properties',
      value: summary.totalProperties || 0,
      icon: Building2,
    },
    {
      label: 'Total bookings',
      value: summary.totalBookings || 0,
      icon: CalendarRange,
    },
    {
      label: 'Verified revenue',
      value: formatMoney(summary.totalRevenue),
      icon: WalletCards,
    },
  ]

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-900">
              <Icon size={19} />
            </span>
            <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.12em] text-stone-400">
              {label}
            </p>
            <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-stone-900">
              {value}
            </p>
          </article>
        ))}
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Booking performance</p>
              <h2 className="mt-2 text-xl font-black text-stone-900">
                Recent activity
              </h2>
            </div>
            <div className="flex rounded-xl bg-stone-100 p-1">
              {ranges.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSearchParams({ range: value })}
                  className={
                    'focus-ring cursor-pointer rounded-lg px-3 py-2 text-xs font-extrabold ' +
                    (range === value
                      ? 'bg-white text-emerald-900 shadow-sm'
                      : 'text-stone-500')
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-stone-50 p-4">
              <p className="text-xs font-bold text-stone-400">Bookings</p>
              <p className="mt-2 text-2xl font-black text-stone-900">
                {data?.dateAnalytics?.totalBookings || 0}
              </p>
            </div>
            <div className="rounded-xl bg-stone-50 p-4">
              <p className="text-xs font-bold text-stone-400">Revenue</p>
              <p className="mt-2 text-2xl font-black text-emerald-950">
                {formatMoney(data?.dateAnalytics?.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <aside className="rounded-2xl bg-amber-50 p-6">
          <p className="eyebrow">Next action</p>
          <h2 className="mt-2 text-xl font-black text-stone-900">
            Grow your live portfolio
          </h2>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Add a complete property record, upload clear images, and submit it
            for platform review.
          </p>
          <Link
            to="/agent/properties/new"
            className="focus-ring mt-5 flex w-fit items-center gap-2 rounded-xl bg-emerald-950 px-4 py-3 text-sm font-black text-white"
          >
            <Plus size={17} /> Create listing
          </Link>
        </aside>
      </section>
    </div>
  )
}

export default AgentDashboardPage
