import {
  AlertTriangle,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  MapPin,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import ActivityPagination from '../activity/ActivityPagination.jsx'
import ReasonAction from '../activity/ReasonAction.jsx'
import StatusBadge from '../activity/StatusBadge.jsx'
import PropertyImage from '../property/PropertyImage.jsx'
import {
  formatDateTime,
} from '../../features/activity/activityFormatters.js'
import {
  useAcceptInspectionReschedule,
  useCancelInspection,
  useMyInspections,
} from '../../features/inspections/inspectionApi.js'
import { getPropertyId, getPropertyLocation } from '../../features/properties/propertyFormatters.js'
import { getApiErrorMessage } from '../../lib/errors.js'

const inspectionStatuses = [
  ['', 'All statuses'],
  ['pending', 'Pending'],
  ['confirmed', 'Confirmed'],
  ['rescheduleProposed', 'New time proposed'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
  ['rejected', 'Rejected'],
]

function InspectionsPanel({
  page,
  status,
  onPageChange,
  onStatusChange,
}) {
  const params = { page, limit: 8 }
  if (status) params.status = status

  const { data, error, isError, isFetching, isLoading, refetch } =
    useMyInspections(params)
  const cancelMutation = useCancelInspection()
  const acceptMutation = useAcceptInspectionReschedule()
  const inspections = data?.inspections || []

  const handleAccept = async (inspectionId) => {
    try {
      await acceptMutation.mutateAsync(inspectionId)
      toast.success('The proposed inspection time was accepted')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to accept the new time.'))
    }
  }

  const handleCancel = async (inspectionId, reason) => {
    try {
      await cancelMutation.mutateAsync({ inspectionId, reason })
      toast.success('Inspection request cancelled')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to cancel inspection.'))
      throw error
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-stone-500">
          Track confirmations and proposed schedule changes from listing agents.
        </p>
        <label className="flex items-center gap-2 text-xs font-extrabold text-stone-500">
          Status
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="focus-ring rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
          >
            {inspectionStatuses.map(([value, label]) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-2xl border border-stone-200 bg-white"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle className="mx-auto text-red-700" size={28} />
          <p className="mt-3 text-sm font-semibold text-red-700">
            {getApiErrorMessage(error, 'Unable to load inspections.')}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="focus-ring mt-4 cursor-pointer rounded-lg bg-emerald-950 px-4 py-2 text-xs font-black text-white"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && inspections.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
          <CalendarCheck2 className="mx-auto text-stone-400" size={32} />
          <h2 className="mt-4 text-xl font-black text-stone-900">
            No inspection requests found
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            Request an inspection from any published sale or rental property.
          </p>
        </div>
      )}

      {!isLoading && !isError && inspections.length > 0 && (
        <div
          className={
            'space-y-4 transition-opacity ' +
            (isFetching ? 'opacity-60' : '')
          }
        >
          {inspections.map((inspection) => {
            const property = inspection.property
            const propertyId = getPropertyId(property)
            const activeDate =
              inspection.status === 'rescheduleProposed'
                ? inspection.proposedFor
                : inspection.scheduledFor || inspection.requestedFor
            const canCancel = [
              'pending',
              'confirmed',
              'rescheduleProposed',
            ].includes(inspection.status)

            return (
              <article
                key={inspection._id}
                className="grid gap-5 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-[150px_1fr] sm:p-5"
              >
                <PropertyImage
                  property={property}
                  className="aspect-[4/3] w-full rounded-xl sm:aspect-square"
                  sizes="150px"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        to={'/properties/' + propertyId}
                        className="focus-ring text-lg font-black text-stone-900 hover:text-emerald-800"
                      >
                        {property.title}
                      </Link>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                        <MapPin size={14} />
                        {getPropertyLocation(property)}
                      </p>
                    </div>
                    <StatusBadge status={inspection.status} />
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm font-bold text-stone-700">
                    <Clock3 size={16} className="text-amber-700" />
                    {formatDateTime(activeDate)}
                  </div>

                  {inspection.status === 'rescheduleProposed' && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">
                      The agent proposed this new time. Accept it to confirm the
                      inspection.
                    </p>
                  )}
                  {(inspection.rejectionReason ||
                    inspection.cancellationReason) && (
                    <p className="mt-2 text-xs leading-5 text-red-700">
                      Reason:{' '}
                      {inspection.rejectionReason ||
                        inspection.cancellationReason}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-start gap-2">
                    {inspection.status === 'rescheduleProposed' && (
                      <button
                        type="button"
                        disabled={acceptMutation.isPending}
                        onClick={() => handleAccept(inspection._id)}
                        className="focus-ring flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-950 px-3 py-2 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 size={15} /> Accept new time
                      </button>
                    )}
                    {canCancel && (
                      <ReasonAction
                        isPending={cancelMutation.isPending}
                        onConfirm={(reason) =>
                          handleCancel(inspection._id, reason)
                        }
                      />
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {!isLoading && !isError && (
        <ActivityPagination
          pagination={data?.pagination}
          isFetching={isFetching}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}

export default InspectionsPanel
