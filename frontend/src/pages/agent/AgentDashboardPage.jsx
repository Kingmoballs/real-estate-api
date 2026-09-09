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

const summaryGridClass =
  'grid grid-cols-3 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm sm:gap-4 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent sm:shadow-none'

const summaryCardClass =
  'min-w-0 border-l border-stone-200 px-2 py-4 text-center first:border-l-0 sm:rounded-2xl sm:border sm:bg-white sm:p-6 sm:text-left sm:shadow-sm sm:first:border-l'

function AgentDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const range = searchParams.get('range') || '30days'
  const { data, error, isError, isLoading, refetch } =
    useAgentDashboard(range)

  if (isLoading) {
    return (
      <div className={summaryGridClass} aria-label="Loading agent summary">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className={`${summaryCardClass} h-24 animate-pulse bg-stone-100 sm:h-36 sm:bg-white`}
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
      <div className={summaryGridClass} aria-label="Agent account summary">
        {cards.map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className={summaryCardClass}
          >
            <span className="mx-auto grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-900 sm:mx-0 sm:size-10 sm:rounded-xl">
              <Icon className="size-4 sm:size-[19px]" />
            </span>
            <p className="mt-2 min-h-8 text-[9px] font-extrabold uppercase leading-4 tracking-[0.08em] text-stone-400 sm:mt-5 sm:min-h-0 sm:text-xs sm:leading-normal sm:tracking-[0.12em]">
              {label}
            </p>
            <p
              title={String(value)}
              className="mt-1 break-words text-[clamp(0.7rem,3.5vw,0.875rem)] font-black leading-tight tracking-[-0.04em] text-stone-900 [overflow-wrap:anywhere] sm:mt-2 sm:text-3xl sm:leading-normal"
            >
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
