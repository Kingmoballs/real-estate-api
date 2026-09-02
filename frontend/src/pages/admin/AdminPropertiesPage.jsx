import {
  AlertTriangle,
  Building2,
  Clock3,
  MapPin,
  Search,
  UserRound,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import ActivityPagination from '../../components/activity/ActivityPagination.jsx'
import StatusBadge from '../../components/activity/StatusBadge.jsx'
import PropertyImage from '../../components/property/PropertyImage.jsx'
import { formatDateTime } from '../../features/activity/activityFormatters.js'
import { useAdminProperties } from '../../features/admin/adminPropertyApi.js'
import {
  formatPropertyPrice,
  formatPropertyType,
  getPropertyLocation,
} from '../../features/properties/propertyFormatters.js'
import { getApiErrorMessage } from '../../lib/errors.js'

const listingStatuses = [
  ['pendingReview', 'Pending review'],
  ['all', 'All statuses'],
  ['draft', 'Draft'],
  ['published', 'Published'],
  ['rejected', 'Rejected'],
  ['unavailable', 'Unavailable'],
  ['rented', 'Rented'],
  ['sold', 'Sold'],
  ['archived', 'Archived'],
]

const listingTypes = [
  ['', 'All listing types'],
  ['shortlet', 'Shortlet'],
  ['rent', 'Long-term rent'],
  ['sale', 'For sale'],
]

function AdminPropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Math.max(Number(searchParams.get('page')) || 1, 1)
  const status = searchParams.get('status') || 'pendingReview'
  const listingType = searchParams.get('listingType') || ''

  const params = {
    page,
    limit: 8,
    listingType,
  }

  if (status !== 'all') {
    params.status = status
  }

  const {
    data,
    error,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useAdminProperties(params)

  const properties = data?.properties || []

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

  return (
    <div>
      <div>
        <p className="eyebrow">Marketplace moderation</p>

        <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-stone-900">
          Property reviews
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
          Review property information, images, pricing, location, and agent
          details before allowing a listing onto the public marketplace.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4">
        <span className="flex items-center gap-2 text-sm font-black text-stone-700">
          <Search size={18} className="text-amber-700" />
          Property moderation queue
        </span>

        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-xs font-extrabold text-stone-500">
            Status

            <select
              value={status}
              onChange={(event) =>
                updateParams({
                  status: event.target.value,
                  page: null,
                })
              }
              className="focus-ring rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
            >
              {listingStatuses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs font-extrabold text-stone-500">
            Listing type

            <select
              value={listingType}
              onChange={(event) =>
                updateParams({
                  listingType: event.target.value,
                  page: null,
                })
              }
              className="focus-ring rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
            >
              {listingTypes.map(([value, label]) => (
                <option key={value || 'all'} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {isLoading && (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-2xl border border-stone-200 bg-white"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle className="mx-auto text-red-700" size={28} />

          <p className="mt-3 text-sm font-semibold text-red-700">
            {getApiErrorMessage(
              error,
              'Unable to load properties for review.',
            )}
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="focus-ring mt-4 cursor-pointer rounded-lg bg-stone-950 px-4 py-2 text-xs font-black text-white"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && properties.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <Building2 className="mx-auto text-stone-400" size={36} />

          <h3 className="mt-4 text-xl font-black text-stone-900">
            No properties found
          </h3>

          <p className="mt-2 text-sm text-stone-500">
            There are no properties matching the selected filters.
          </p>
        </div>
      )}

      {!isLoading && !isError && properties.length > 0 && (
        <div
          className={
            'mt-6 space-y-5 transition-opacity ' +
            (isFetching ? 'opacity-60' : '')
          }
        >
          {properties.map((property) => (
            <article
              key={property._id}
              className="grid gap-5 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-[190px_1fr] md:p-5"
            >
              <PropertyImage
                property={property}
                className="aspect-[4/3] w-full rounded-xl md:aspect-square"
                sizes="190px"
              />

              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-stone-900">
                      {property.title}
                    </h3>

                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                      <MapPin size={14} />
                      {getPropertyLocation(property) ||
                        'Location not provided'}
                    </p>
                  </div>

                  <StatusBadge status={property.listingStatus} />
                </div>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-stone-600">
                  <span className="text-emerald-950">
                    {formatPropertyPrice(property)}
                  </span>

                  <span className="capitalize">
                    {property.listingType}
                  </span>

                  <span>
                    {formatPropertyType(property.propertyType)}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-xs text-stone-500 sm:grid-cols-2">
                  <p className="flex items-center gap-2">
                    <UserRound size={14} />
                    Agent: {property.postedBy?.name || property.agentName}
                  </p>

                  <p className="flex items-center gap-2">
                    <Clock3 size={14} />
                    Submitted:{' '}
                    {formatDateTime(property.submittedForReviewAt)}
                  </p>
                </div>

                {property.rejectionReason && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold leading-5 text-red-700">
                    Previous review feedback: {property.rejectionReason}
                  </p>
                )}

                <Link
                  to={'/admin/properties/' + property._id}
                  className="focus-ring mt-4 inline-flex rounded-lg bg-stone-950 px-4 py-2.5 text-xs font-extrabold text-white"
                >
                  {property.listingStatus === 'pendingReview'
                    ? 'Review property'
                    : 'View property details'}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {!isLoading && !isError && (
        <ActivityPagination
          pagination={data?.pagination}
          isFetching={isFetching}
          onPageChange={(nextPage) =>
            updateParams({ page: nextPage })
          }
        />
      )}
    </div>
  )
}

export default AdminPropertiesPage