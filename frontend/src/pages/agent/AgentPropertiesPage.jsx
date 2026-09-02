import {
  AlertTriangle,
  Building2,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Send,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import ActivityPagination from '../../components/activity/ActivityPagination.jsx'
import ConfirmAction from '../../components/activity/ConfirmAction.jsx'
import StatusBadge from '../../components/activity/StatusBadge.jsx'
import PropertyImage from '../../components/property/PropertyImage.jsx'
import {
  useAgentProperties,
  useArchiveAgentProperty,
  useRelistAgentProperty,
  useSubmitAgentProperty,
  useUpdateAgentPropertyStatus,
} from '../../features/agent/agentPropertyApi.js'
import {
  formatPropertyPrice,
  getPropertyLocation,
} from '../../features/properties/propertyFormatters.js'
import { getApiErrorMessage } from '../../lib/errors.js'

const listingStatuses = [
  ['', 'All statuses'],
  ['draft', 'Draft'],
  ['pendingReview', 'Pending review'],
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

function AgentPropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(Number(searchParams.get('page')) || 1, 1)
  const status = searchParams.get('status') || ''
  const listingType = searchParams.get('listingType') || ''
  const params = { page, limit: 8, status, listingType }
  const { data, error, isError, isFetching, isLoading, refetch } =
    useAgentProperties(params)
  const submitMutation = useSubmitAgentProperty()
  const statusMutation = useUpdateAgentPropertyStatus()
  const relistMutation = useRelistAgentProperty()
  const archiveMutation = useArchiveAgentProperty()
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

  const runAction = async (operation, successMessage, fallbackMessage) => {
    try {
      await operation()
      toast.success(successMessage)
    } catch (actionError) {
      toast.error(getApiErrorMessage(actionError, fallbackMessage))
      throw actionError
    }
  }

  const runDirectAction = (operation, successMessage, fallbackMessage) => {
    runAction(operation, successMessage, fallbackMessage).catch(() => {})
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Listing inventory</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-stone-900">
            My properties
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
            Create, submit, publish, pause, and close listings from one place.
          </p>
        </div>
        <Link
          to="/agent/properties/new"
          className="focus-ring flex w-fit items-center gap-2 rounded-xl bg-emerald-950 px-4 py-3 text-sm font-black text-white"
        >
          <Plus size={17} /> Create property
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-stone-200 bg-white p-4">
        <label className="text-xs font-extrabold text-stone-500">
          Status
          <select
            value={status}
            onChange={(event) =>
              updateParams({ status: event.target.value, page: null })
            }
            className="focus-ring ml-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
          >
            {listingStatuses.map(([value, label]) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-extrabold text-stone-500">
          Type
          <select
            value={listingType}
            onChange={(event) =>
              updateParams({ listingType: event.target.value, page: null })
            }
            className="focus-ring ml-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
          >
            {listingTypes.map(([value, label]) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <PropertiesLoading />}
      {isError && (
        <PropertiesError error={error} onRetry={() => refetch()} />
      )}
      {!isLoading && !isError && properties.length === 0 && (
        <PropertiesEmpty />
      )}

      {!isLoading && !isError && properties.length > 0 && (
        <div
          className={
            'mt-6 space-y-5 transition-opacity ' +
            (isFetching ? 'opacity-60' : '')
          }
        >
          {properties.map((property) => (
            <PropertyManagementCard
              key={property._id}
              property={property}
              mutations={{
                submit: submitMutation,
                status: statusMutation,
                relist: relistMutation,
                archive: archiveMutation,
              }}
              runAction={runAction}
              runDirectAction={runDirectAction}
            />
          ))}
        </div>
      )}

      {!isLoading && !isError && (
        <ActivityPagination
          pagination={data?.pagination}
          isFetching={isFetching}
          onPageChange={(nextPage) => updateParams({ page: nextPage })}
        />
      )}
    </div>
  )
}

function PropertiesLoading() {
  return (
    <div className="mt-6 space-y-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="h-52 animate-pulse rounded-2xl border border-stone-200 bg-white"
        />
      ))}
    </div>
  )
}

function PropertiesError({ error, onRetry }) {
  return (
    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertTriangle className="mx-auto text-red-700" size={28} />
      <p className="mt-3 text-sm font-semibold text-red-700">
        {getApiErrorMessage(error, 'Unable to load your properties.')}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="focus-ring mt-4 cursor-pointer rounded-lg bg-emerald-950 px-4 py-2 text-xs font-black text-white"
      >
        Try again
      </button>
    </div>
  )
}

function PropertiesEmpty() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
      <Building2 className="mx-auto text-stone-400" size={36} />
      <h3 className="mt-4 text-xl font-black text-stone-900">
        No properties found
      </h3>
      <p className="mt-2 text-sm text-stone-500">
        Adjust the filters or create your first property listing.
      </p>
    </div>
  )
}

function PropertyManagementCard({
  property,
  mutations,
  runAction,
  runDirectAction,
}) {
  const statusValue = property.listingStatus
  const canEdit = !['sold', 'rented', 'archived'].includes(statusValue)

  return (
    <article className="grid gap-5 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-[190px_1fr] md:p-5">
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
              <MapPin size={14} /> {getPropertyLocation(property)}
            </p>
          </div>
          <StatusBadge status={statusValue} />
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-stone-600">
          <span className="text-emerald-950">
            {formatPropertyPrice(property)}
          </span>
          <span className="capitalize">{property.listingType}</span>
          <span className="capitalize">{property.propertyType}</span>
        </div>

        {property.rejectionReason && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold leading-5 text-red-700">
            Review feedback: {property.rejectionReason}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-start gap-2">
          {statusValue === 'published' && (
            <Link
              to={'/properties/' + property._id}
              className="focus-ring flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold text-emerald-900 hover:bg-emerald-50"
            >
              <Eye size={15} /> View live
            </Link>
          )}
          {canEdit && (
            <Link
              to={'/agent/properties/' + property._id + '/edit'}
              className="focus-ring flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold text-stone-700 hover:bg-stone-100"
            >
              <Pencil size={15} /> Edit
            </Link>
          )}
          <PropertyWorkflowActions
            property={property}
            mutations={mutations}
            runAction={runAction}
            runDirectAction={runDirectAction}
          />
        </div>
      </div>
    </article>
  )
}

function PropertyWorkflowActions({
  property,
  mutations,
  runAction,
  runDirectAction,
}) {
  const propertyId = property._id
  const status = property.listingStatus

  return (
    <>
      {['draft', 'rejected'].includes(status) && (
        <button
          type="button"
          disabled={mutations.submit.isPending}
          onClick={() =>
            runDirectAction(
              () => mutations.submit.mutateAsync(propertyId),
              'Property submitted for review',
              'Unable to submit property.',
            )
          }
          className="focus-ring flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-950 px-3 py-2 text-xs font-extrabold text-white disabled:opacity-60"
        >
          <Send size={15} /> Submit for review
        </button>
      )}
      {status === 'published' && (
        <button
          type="button"
          disabled={mutations.status.isPending}
          onClick={() =>
            runDirectAction(
              () =>
                mutations.status.mutateAsync({
                  propertyId,
                  status: 'unavailable',
                }),
              'Property marked unavailable',
              'Unable to update property status.',
            )
          }
          className="focus-ring cursor-pointer rounded-lg px-3 py-2 text-xs font-extrabold text-amber-800 hover:bg-amber-50 disabled:opacity-60"
        >
          Mark unavailable
        </button>
      )}
      {status === 'unavailable' && (
        <button
          type="button"
          disabled={mutations.status.isPending}
          onClick={() =>
            runDirectAction(
              () =>
                mutations.status.mutateAsync({
                  propertyId,
                  status: 'published',
                }),
              'Property is available again',
              'Unable to update property status.',
            )
          }
          className="focus-ring cursor-pointer rounded-lg bg-emerald-950 px-3 py-2 text-xs font-extrabold text-white disabled:opacity-60"
        >
          Make available
        </button>
      )}
      {status === 'published' &&
        ['rent', 'sale'].includes(property.listingType) && (
          <ConfirmAction
            buttonLabel={
              property.listingType === 'rent' ? 'Mark rented' : 'Mark sold'
            }
            confirmLabel="Confirm status"
            description="This closes the current listing. You can submit it for relisting later."
            isPending={mutations.status.isPending}
            onConfirm={() =>
              runAction(
                () =>
                  mutations.status.mutateAsync({
                    propertyId,
                    status:
                      property.listingType === 'rent' ? 'rented' : 'sold',
                  }),
                'Property status updated',
                'Unable to close this listing.',
              )
            }
          />
        )}
      {['rented', 'sold'].includes(status) && (
        <button
          type="button"
          disabled={mutations.relist.isPending}
          onClick={() =>
            runDirectAction(
              () => mutations.relist.mutateAsync(propertyId),
              'Property submitted for relisting review',
              'Unable to relist property.',
            )
          }
          className="focus-ring cursor-pointer rounded-lg bg-emerald-950 px-3 py-2 text-xs font-extrabold text-white disabled:opacity-60"
        >
          Relist property
        </button>
      )}
      {status !== 'archived' && (
        <ConfirmAction
          tone="danger"
          buttonLabel="Archive"
          confirmLabel="Archive property"
          description="Archiving removes this listing from active management and cannot currently be undone."
          isPending={mutations.archive.isPending}
          onConfirm={() =>
            runAction(
              () => mutations.archive.mutateAsync(propertyId),
              'Property archived',
              'Unable to archive property.',
            )
          }
        />
      )}
    </>
  )
}

export default AgentPropertiesPage
