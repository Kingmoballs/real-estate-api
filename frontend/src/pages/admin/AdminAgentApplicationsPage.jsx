import {
  AlertTriangle,
  Building2,
  ClipboardCheck,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import ActivityPagination from '../../components/activity/ActivityPagination.jsx'
import ConfirmAction from '../../components/activity/ConfirmAction.jsx'
import ReasonAction from '../../components/activity/ReasonAction.jsx'
import StatusBadge from '../../components/activity/StatusBadge.jsx'
import { formatDateTime } from '../../features/activity/activityFormatters.js'
import {
  useAdminAgentApplications,
  useApproveAgentApplication,
  useRejectAgentApplication,
} from '../../features/admin/adminAgentApplicationApi.js'
import { getApiErrorMessage } from '../../lib/errors.js'

const applicationStatuses = [
  ['', 'All applications'],
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
]

function AdminAgentApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(Number(searchParams.get('page')) || 1, 1)
  const status = searchParams.get('status') || ''

  const params = {
    page,
    limit: 8,
    status,
  }

  const {
    data,
    error,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useAdminAgentApplications(params)

  const approveMutation = useApproveAgentApplication()
  const rejectMutation = useRejectAgentApplication()
  const applications = data?.applications || []

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
        <p className="eyebrow">Agent onboarding</p>

        <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-stone-900">
          Agent applications
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
          Review applicants before granting permission to create and manage
          property listings.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4">
        <span className="flex items-center gap-2 text-sm font-black text-stone-700">
          <ClipboardCheck size={18} className="text-amber-700" />
          Application review queue
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
            {applicationStatuses.map(([value, label]) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <ApplicationsLoading />}

      {isError && (
        <ApplicationsError
          error={error}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && applications.length === 0 && (
        <ApplicationsEmpty />
      )}

      {!isLoading && !isError && applications.length > 0 && (
        <div
          className={
            'mt-6 space-y-5 transition-opacity ' +
            (isFetching ? 'opacity-60' : '')
          }
        >
          {applications.map((application) => (
            <ApplicationCard
              key={application._id}
              application={application}
              approveMutation={approveMutation}
              rejectMutation={rejectMutation}
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

function ApplicationsLoading() {
  return (
    <div className="mt-6 space-y-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="h-72 animate-pulse rounded-2xl border border-stone-200 bg-white"
        />
      ))}
    </div>
  )
}

function ApplicationsError({ error, onRetry }) {
  return (
    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertTriangle className="mx-auto text-red-700" size={28} />

      <p className="mt-3 text-sm font-semibold text-red-700">
        {getApiErrorMessage(
          error,
          'Unable to load agent applications.',
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

function ApplicationsEmpty() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
      <ClipboardCheck className="mx-auto text-stone-400" size={36} />

      <h3 className="mt-4 text-xl font-black text-stone-900">
        No applications found
      </h3>

      <p className="mt-2 text-sm text-stone-500">
        New applications will appear here when users apply to become agents.
      </p>
    </div>
  )
}

function ApplicationCard({
  application,
  approveMutation,
  rejectMutation,
  runAction,
}) {
  const applicant = application.applicant || {}
  const isPending = application.status === 'pending'

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-700">
            <UserRound size={20} />
          </span>

          <div className="min-w-0">
            <h3 className="text-lg font-black text-stone-900">
              {applicant.name || application.businessName}
            </h3>

            <p className="mt-1 text-sm font-semibold text-stone-500">
              {application.businessName}
            </p>
          </div>
        </div>

        <StatusBadge status={application.status} />
      </div>

      <div className="mt-5 grid gap-4 rounded-xl bg-stone-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-bold text-stone-400">
            Applicant
          </p>

          {applicant.email && (
            <a
              href={'mailto:' + applicant.email}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-emerald-800"
            >
              <Mail size={14} />
              {applicant.email}
            </a>
          )}

          {applicant.phone && (
            <a
              href={'tel:' + applicant.phone}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-emerald-800"
            >
              <Phone size={14} />
              {applicant.phone}
            </a>
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-stone-400">
            Business
          </p>

          <p className="mt-2 flex items-center gap-1.5 text-xs font-extrabold capitalize text-stone-700">
            <Building2 size={14} />
            {application.businessType}
          </p>

          {application.registrationNumber && (
            <p className="mt-2 text-xs font-semibold text-stone-600">
              Registration: {application.registrationNumber}
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-stone-400">
            Experience
          </p>

          <p className="mt-2 text-xs font-extrabold text-stone-700">
            {application.yearsOfExperience}{' '}
            {application.yearsOfExperience === 1 ? 'year' : 'years'}
          </p>

          <p className="mt-2 text-xs text-stone-500">
            Submission number {application.submissionCount}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold text-stone-400">
            Submitted
          </p>

          <p className="mt-2 text-xs font-extrabold text-stone-700">
            {formatDateTime(application.submittedAt)}
          </p>

          {application.reviewedAt && (
            <p className="mt-2 text-xs text-stone-500">
              Reviewed {formatDateTime(application.reviewedAt)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-stone-400">
            Office address
          </p>

          <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-stone-700">
            <MapPin size={16} className="mt-1 shrink-0 text-amber-700" />
            {application.officeAddress}
          </p>

          <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.12em] text-stone-400">
            Service areas
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {application.serviceAreas?.map((area) => (
              <span
                key={area}
                className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-extrabold text-emerald-800"
              >
                {area}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-stone-400">
            Applicant biography
          </p>

          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-stone-600">
            {application.bio}
          </p>
        </div>
      </div>

      {application.rejectionReason && (
        <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700">
          Rejection reason: {application.rejectionReason}
        </p>
      )}

      {application.reviewedBy && (
        <p className="mt-4 text-xs font-semibold text-stone-500">
          Reviewed by {application.reviewedBy.name}
        </p>
      )}

      {isPending && (
        <div className="mt-5 flex flex-wrap items-start gap-2 border-t border-stone-200 pt-4">
          <ConfirmAction
            buttonLabel="Approve application"
            confirmLabel="Approve and grant agent access"
            description="Approval immediately changes this user’s platform role from user to agent."
            isPending={approveMutation.isPending}
            onConfirm={() =>
              runAction(
                () =>
                  approveMutation.mutateAsync(application._id),
                'Agent application approved',
                'Unable to approve this application.',
              )
            }
          />

          <ReasonAction
            buttonLabel="Reject application"
            confirmLabel="Confirm rejection"
            reasonLabel="Reason for rejecting this application"
            minimumLength={10}
            isPending={rejectMutation.isPending}
            onConfirm={(reason) =>
              runAction(
                () =>
                  rejectMutation.mutateAsync({
                    applicationId: application._id,
                    reason,
                  }),
                'Agent application rejected',
                'Unable to reject this application.',
              )
            }
          />
        </div>
      )}
    </article>
  )
}

export default AdminAgentApplicationsPage