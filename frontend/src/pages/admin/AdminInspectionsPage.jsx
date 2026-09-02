import {
  AlertTriangle,
  CalendarCheck2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import ActivityPagination from '../../components/activity/ActivityPagination.jsx'
import ConfirmAction from '../../components/activity/ConfirmAction.jsx'
import ReasonAction from '../../components/activity/ReasonAction.jsx'
import StatusBadge from '../../components/activity/StatusBadge.jsx'
import InspectionRescheduleAction from '../../components/agent/InspectionRescheduleAction.jsx'
import PropertyImage from '../../components/property/PropertyImage.jsx'
import { formatDateTime } from '../../features/activity/activityFormatters.js'
import {
  useAdminInspections,
  useCancelInspection,
  useCompleteInspection,
  useConfirmInspection,
  useRejectInspection,
  useRescheduleInspection,
} from '../../features/inspections/inspectionApi.js'
import {
  getPropertyId,
  getPropertyLocation,
} from '../../features/properties/propertyFormatters.js'
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

function AdminInspectionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Math.max(Number(searchParams.get('page')) || 1, 1)
  const status = searchParams.get('status') || ''

  const params = {
    page,
    limit: 8,
  }

  if (status) {
    params.status = status
  }

  const {
    data,
    error,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useAdminInspections(params)

  const confirmMutation = useConfirmInspection()
  const rescheduleMutation = useRescheduleInspection()
  const rejectMutation = useRejectInspection()
  const cancelMutation = useCancelInspection()
  const completeMutation = useCompleteInspection()

  const inspections = data?.inspections || []

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

  const runAction = async (
    operation,
    successMessage,
    fallbackMessage,
  ) => {
    try {
      await operation()
      toast.success(successMessage)
    } catch (actionError) {
      toast.error(getApiErrorMessage(actionError, fallbackMessage))
      throw actionError
    }
  }

  return (
    <div>
      <div>
        <p className="eyebrow">Platform scheduling</p>

        <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-stone-900">
          Inspection management
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
          Monitor and manage inspection requests across every customer,
          property, and agent on the platform.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4">
        <span className="flex items-center gap-2 text-sm font-black text-stone-700">
          <CalendarCheck2 size={18} className="text-amber-700" />
          Platform inspection queue
        </span>

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
            {inspectionStatuses.map(([value, label]) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <InspectionLoading />}

      {isError && (
        <InspectionError
          error={error}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && inspections.length === 0 && (
        <InspectionEmpty />
      )}

      {!isLoading && !isError && inspections.length > 0 && (
        <div
          className={
            'mt-6 space-y-5 transition-opacity ' +
            (isFetching ? 'opacity-60' : '')
          }
        >
          {inspections.map((inspection) => (
            <AdminInspectionCard
              key={inspection._id}
              inspection={inspection}
              mutations={{
                confirm: confirmMutation,
                reschedule: rescheduleMutation,
                reject: rejectMutation,
                cancel: cancelMutation,
                complete: completeMutation,
              }}
              runAction={runAction}
            />
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

function InspectionLoading() {
  return (
    <div className="mt-6 space-y-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="h-80 animate-pulse rounded-2xl border border-stone-200 bg-white"
        />
      ))}
    </div>
  )
}

function InspectionError({ error, onRetry }) {
  return (
    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertTriangle className="mx-auto text-red-700" size={28} />

      <p className="mt-3 text-sm font-semibold text-red-700">
        {getApiErrorMessage(
          error,
          'Unable to load platform inspections.',
        )}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="focus-ring mt-4 cursor-pointer rounded-lg bg-stone-950 px-4 py-2 text-xs font-black text-white"
      >
        Try again
      </button>
    </div>
  )
}

function InspectionEmpty() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
      <CalendarCheck2 className="mx-auto text-stone-400" size={36} />

      <h3 className="mt-4 text-xl font-black text-stone-900">
        No inspections found
      </h3>

      <p className="mt-2 text-sm text-stone-500">
        There are no inspection requests matching the selected status.
      </p>
    </div>
  )
}

function AdminInspectionCard({
  inspection,
  mutations,
  runAction,
}) {
  const property = inspection.property
  const propertyId = getPropertyId(property)
  const customer = inspection.customer || {}
  const agent = inspection.agent || {}
  const status = inspection.status

  const canReschedule = ['pending', 'confirmed'].includes(status)

  const canReject = [
    'pending',
    'rescheduleProposed',
  ].includes(status)

  const canCancel = [
    'pending',
    'confirmed',
    'rescheduleProposed',
  ].includes(status)

  return (
    <article className="grid gap-5 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-[180px_1fr] md:p-5">
      <PropertyImage
        property={property}
        className="aspect-[4/3] w-full rounded-xl md:aspect-square"
        sizes="180px"
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              to={'/admin/properties/' + propertyId}
              className="focus-ring text-lg font-black text-stone-900 hover:text-emerald-800"
            >
              {property.title}
            </Link>

            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
              <MapPin size={14} />
              {getPropertyLocation(property) ||
                'Location not provided'}
            </p>
          </div>

          <StatusBadge status={status} />
        </div>

        <div className="mt-4 grid gap-4 rounded-xl bg-stone-50 p-4 sm:grid-cols-2">
          <ContactDetails
            label="Customer"
            person={customer}
            icon={UserRound}
          />

          <ContactDetails
            label="Listing agent"
            person={agent}
            icon={ShieldCheck}
          />
        </div>

        <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
          <ScheduleDetail
            label="Requested time"
            value={inspection.requestedFor}
          />

          {inspection.scheduledFor && (
            <ScheduleDetail
              label="Confirmed time"
              value={inspection.scheduledFor}
              tone="confirmed"
            />
          )}

          {inspection.proposedFor &&
            status === 'rescheduleProposed' && (
              <ScheduleDetail
                label="Proposed time"
                value={inspection.proposedFor}
                tone="proposed"
              />
            )}
        </div>

        {(inspection.message || inspection.agentMessage) && (
          <div className="mt-4 space-y-2 rounded-xl border border-stone-200 p-4 text-xs leading-5 text-stone-600">
            {inspection.message && (
              <p>
                <strong className="text-stone-800">
                  Customer note:
                </strong>{' '}
                {inspection.message}
              </p>
            )}

            {inspection.agentMessage && (
              <p>
                <strong className="text-stone-800">
                  Agent note:
                </strong>{' '}
                {inspection.agentMessage}
              </p>
            )}
          </div>
        )}

        {(inspection.rejectionReason ||
          inspection.cancellationReason) && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700">
            Reason:{' '}
            {inspection.rejectionReason ||
              inspection.cancellationReason}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-start gap-2">
          {status === 'pending' && (
            <ConfirmAction
              buttonLabel="Confirm inspection"
              confirmLabel="Confirm customer request"
              description="The customer’s requested time will become the confirmed inspection time."
              isPending={mutations.confirm.isPending}
              onConfirm={() =>
                runAction(
                  () =>
                    mutations.confirm.mutateAsync(
                      inspection._id,
                    ),
                  'Inspection confirmed',
                  'Unable to confirm this inspection.',
                )
              }
            />
          )}

          {canReschedule && (
            <InspectionRescheduleAction
              isPending={mutations.reschedule.isPending}
              onConfirm={({ proposedFor, message }) =>
                runAction(
                  () =>
                    mutations.reschedule.mutateAsync({
                      inspectionId: inspection._id,
                      proposedFor,
                      message,
                    }),
                  'New inspection time proposed',
                  'Unable to propose a new inspection time.',
                )
              }
            />
          )}

          {status === 'confirmed' && (
            <ConfirmAction
              buttonLabel="Mark completed"
              confirmLabel="Complete inspection"
              description="Only complete this inspection after the scheduled meeting has taken place."
              isPending={mutations.complete.isPending}
              onConfirm={() =>
                runAction(
                  () =>
                    mutations.complete.mutateAsync(
                      inspection._id,
                    ),
                  'Inspection marked as completed',
                  'The inspection can only be completed after its scheduled time.',
                )
              }
            />
          )}

          {canReject && (
            <ReasonAction
              buttonLabel="Reject request"
              confirmLabel="Confirm rejection"
              reasonLabel="Reason for rejecting this inspection"
              minimumLength={3}
              isPending={mutations.reject.isPending}
              onConfirm={(reason) =>
                runAction(
                  () =>
                    mutations.reject.mutateAsync({
                      inspectionId: inspection._id,
                      reason,
                    }),
                  'Inspection rejected',
                  'Unable to reject this inspection.',
                )
              }
            />
          )}

          {canCancel && (
            <ReasonAction
              buttonLabel="Cancel inspection"
              confirmLabel="Confirm cancellation"
              reasonLabel="Reason for cancelling this inspection"
              minimumLength={3}
              isPending={mutations.cancel.isPending}
              onConfirm={(reason) =>
                runAction(
                  () =>
                    mutations.cancel.mutateAsync({
                      inspectionId: inspection._id,
                      reason,
                    }),
                  'Inspection cancelled',
                  'Unable to cancel this inspection.',
                )
              }
            />
          )}
        </div>
      </div>
    </article>
  )
}

function ContactDetails({ label, person, icon: Icon }) {
  return (
    <div>
      <p className="text-xs font-bold text-stone-400">
        {label}
      </p>

      <p className="mt-2 flex items-center gap-1.5 text-xs font-extrabold text-stone-700">
        <Icon size={14} />
        {person.name || 'Not available'}
      </p>

      {person.email && (
        <a
          href={'mailto:' + person.email}
          className="mt-2 flex items-center gap-1.5 text-xs text-stone-600 hover:text-emerald-800"
        >
          <Mail size={13} />
          {person.email}
        </a>
      )}

      {person.phone && (
        <a
          href={'tel:' + person.phone}
          className="mt-2 flex items-center gap-1.5 text-xs text-stone-600 hover:text-emerald-800"
        >
          <Phone size={13} />
          {person.phone}
        </a>
      )}
    </div>
  )
}

function ScheduleDetail({ label, value, tone = 'default' }) {
  const toneClass =
    tone === 'confirmed'
      ? 'bg-emerald-50 text-emerald-800'
      : tone === 'proposed'
        ? 'bg-amber-50 text-amber-800'
        : 'bg-stone-50 text-stone-700'

  return (
    <div className={'rounded-xl p-3 ' + toneClass}>
      <p className="flex items-center gap-1.5 font-bold opacity-70">
        <Clock3 size={14} />
        {label}
      </p>

      <p className="mt-2 font-extrabold">
        {formatDateTime(value)}
      </p>
    </div>
  )
}

export default AdminInspectionsPage
