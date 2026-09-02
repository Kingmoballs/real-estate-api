import {
  Bookmark,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarRange,
  MessageSquareText,
  UserRound,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import InspectionsPanel from '../components/account/InspectionsPanel.jsx'
import SavedPropertiesPanel from '../components/account/SavedPropertiesPanel.jsx'
import MyReviewsPanel from '../components/account/MyReviewsPanel.jsx'
import useAuth from '../features/auth/useAuth.js'

function AccountPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')

  const customerTabs = [
    'inspections',
    'reviews',
  ]

  const tab =
    user.role === 'user' &&
    customerTabs.includes(requestedTab)
      ? requestedTab
      : 'saved'
  const savedPage = Math.max(Number(searchParams.get('savedPage')) || 1, 1)
  const inspectionPage = Math.max(
    Number(searchParams.get('inspectionPage')) || 1,
    1,
  )
  const inspectionStatus = searchParams.get('inspectionStatus') || ''

  const reviewPage = Math.max(
    Number(
      searchParams.get('reviewPage'),
    ) || 1,
    1,
  )

  const updateParams = (updates) => {
    const nextParams = new URLSearchParams(searchParams)

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        nextParams.set(key, String(value))
      } else {
        nextParams.delete(key)
      }
    })

    setSearchParams(nextParams)
  }

  const selectTab = (nextTab) => {
    setSearchParams(nextTab === 'saved' ? {} : { tab: nextTab })
  }

  return (
    <main className="page-shell py-10 sm:py-14">
      <section className="rounded-[2rem] bg-emerald-950 px-6 py-8 text-white sm:px-9">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span className="grid size-11 place-items-center rounded-xl bg-white/10">
              <UserRound size={21} />
            </span>
            <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-200">
              My account
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
              Welcome, {user.name.split(' ')[0]}
            </h1>
            <p className="mt-2 text-sm text-emerald-100/70">{user.email}</p>
          </div>
          {user.role === 'user' && (
            <div className="flex flex-wrap gap-3">
              <Link
                to="/bookings"
                className="focus-ring flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-emerald-950"
              >
                <CalendarRange size={17} />
                View shortlet bookings
              </Link>

              <Link
                to="/agent-application"
                className="focus-ring flex w-fit items-center gap-2 rounded-xl border border-emerald-700 bg-emerald-900 px-4 py-3 text-sm font-black text-white"
              >
                <BriefcaseBusiness
                  size={17}
                />
                Become an agent
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="mt-8 flex gap-2 border-b border-stone-200">
        <button
          type="button"
          onClick={() => selectTab('saved')}
          className={
            'focus-ring flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-extrabold ' +
            (tab === 'saved'
              ? 'border-emerald-900 text-emerald-900'
              : 'border-transparent text-stone-500')
          }
        >
          <Bookmark size={17} /> Saved properties
        </button>
        {user.role === 'user' && (
          <button
            type="button"
            onClick={() => selectTab('inspections')}
            className={
              'focus-ring flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-extrabold ' +
              (tab === 'inspections'
                ? 'border-emerald-900 text-emerald-900'
                : 'border-transparent text-stone-500')
            }
          >
            <CalendarCheck2 size={17} /> Inspections
          </button>
        )}

        {user.role === 'user' && (
          <button
            type="button"
            onClick={() =>
              selectTab('reviews')
            }
            className={
              'focus-ring flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-extrabold ' +
              (tab === 'reviews'
                ? 'border-emerald-900 text-emerald-900'
                : 'border-transparent text-stone-500')
            }
          >
            <MessageSquareText size={17} />
            My reviews
          </button>
        )}
      </div>

      <section className="mt-7">
        {tab === 'saved' && (
          <SavedPropertiesPanel
            page={savedPage}
            onPageChange={(page) =>
              updateParams({
                savedPage: page,
              })
            }
          />
        )}

        {tab === 'inspections' && (
          <InspectionsPanel
            page={inspectionPage}
            status={inspectionStatus}
            onPageChange={(page) =>
              updateParams({
                inspectionPage: page,
              })
            }
            onStatusChange={(status) =>
              updateParams({
                inspectionStatus: status,
                inspectionPage: null,
              })
            }
          />
        )}

        {tab === 'reviews' && (
          <MyReviewsPanel
            page={reviewPage}
            onPageChange={(page) =>
              updateParams({
                reviewPage: page,
              })
            }
          />
        )}
      </section>
    </main>
  )
}

export default AccountPage
