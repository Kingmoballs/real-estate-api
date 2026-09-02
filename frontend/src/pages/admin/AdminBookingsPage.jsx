import {
  AlertTriangle,
  CalendarRange,
  Clock3,
  CreditCard,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import ActivityPagination from '../../components/activity/ActivityPagination.jsx'
import ConfirmAction from '../../components/activity/ConfirmAction.jsx'
import ReasonAction from '../../components/activity/ReasonAction.jsx'
import StatusBadge from '../../components/activity/StatusBadge.jsx'
import PropertyImage from '../../components/property/PropertyImage.jsx'
import {
  formatDate,
  formatDateTime,
  formatMoney,
} from '../../features/activity/activityFormatters.js'
import {
  useAdminBookings,
  useCancelBooking,
  useRejectBookingReceipt,
  useVerifyBookingReceipt,
} from '../../features/bookings/bookingApi.js'
import {
  getPropertyId,
  getPropertyLocation,
} from '../../features/properties/propertyFormatters.js'
import { getApiErrorMessage } from '../../lib/errors.js'

const bookingStatuses = [
  ['', 'All booking statuses'],
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['active', 'Active'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
  ['rejected', 'Rejected'],
  ['expired', 'Expired'],
]

const paymentStatuses = [
  ['receiptUploaded', 'Receipts awaiting review'],
  ['all', 'All payment statuses'],
  ['unpaid', 'Unpaid'],
  ['verified', 'Verified'],
  ['rejected', 'Receipt rejected'],
]

function AdminBookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Math.max(Number(searchParams.get('page')) || 1, 1)
  const status = searchParams.get('status') || ''
  const paymentStatus =
    searchParams.get('paymentStatus') || 'receiptUploaded'

  const params = {
    page,
    limit: 8,
  }

  if (status) {
    params.status = status
  }

  if (paymentStatus !== 'all') {
    params.paymentStatus = paymentStatus
  }

  const {
    data,
    error,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useAdminBookings(params)

  const cancelMutation = useCancelBooking()
  const verifyMutation = useVerifyBookingReceipt()
  const rejectReceiptMutation = useRejectBookingReceipt()
  const bookings = data?.bookings || []

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
        <p className="eyebrow">Shortlet operations</p>

        <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-stone-900">
          Booking and payment management
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
          Monitor shortlet bookings across the platform and review payment
          receipts submitted by guests.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4">
        <span className="flex items-center gap-2 text-sm font-black text-stone-700">
          <CreditCard size={18} className="text-amber-700" />
          Payment review queue
        </span>

        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-xs font-extrabold text-stone-500">
            Booking

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
              {bookingStatuses.map(([value, label]) => (
                <option key={value || 'all'} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs font-extrabold text-stone-500">
            Payment

            <select
              value={paymentStatus}
              onChange={(event) =>
                updateParams({
                  paymentStatus: event.target.value,
                  page: null,
                })
              }
              className="focus-ring rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
            >
              {paymentStatuses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {isLoading && <BookingLoading />}

      {isError && (
        <BookingError
          error={error}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && bookings.length === 0 && (
        <BookingEmpty paymentStatus={paymentStatus} />
      )}

      {!isLoading && !isError && bookings.length > 0 && (
        <div
          className={
            'mt-6 space-y-5 transition-opacity ' +
            (isFetching ? 'opacity-60' : '')
          }
        >
          {bookings.map((booking) => (
            <AdminBookingCard
              key={booking._id}
              booking={booking}
              mutations={{
                cancel: cancelMutation,
                verify: verifyMutation,
                rejectReceipt: rejectReceiptMutation,
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

function BookingLoading() {
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

function BookingError({ error, onRetry }) {
  return (
    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertTriangle className="mx-auto text-red-700" size={28} />

      <p className="mt-3 text-sm font-semibold text-red-700">
        {getApiErrorMessage(
          error,
          'Unable to load platform bookings.',
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

function BookingEmpty({ paymentStatus }) {
  const waitingForReceipts = paymentStatus === 'receiptUploaded'

  return (
    <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
      <CalendarRange className="mx-auto text-stone-400" size={36} />

      <h3 className="mt-4 text-xl font-black text-stone-900">
        {waitingForReceipts
          ? 'No receipts are awaiting review'
          : 'No bookings found'}
      </h3>

      <p className="mt-2 text-sm text-stone-500">
        {waitingForReceipts
          ? 'Newly uploaded payment receipts will appear here.'
          : 'There are no bookings matching the selected filters.'}
      </p>
    </div>
  )
}

function AdminBookingCard({
  booking,
  mutations,
  runAction,
}) {
  const property = booking.property
  const propertyId = getPropertyId(property)
  const guest = booking.guest || {}

  const receiptRequiresReview =
    booking.bookingStatus === 'approved' &&
    booking.paymentStatus === 'receiptUploaded'

  const canCancel =
    ['pending', 'approved'].includes(booking.bookingStatus) &&
    !['receiptUploaded', 'verified'].includes(
      booking.paymentStatus,
    )

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

          <div className="flex flex-wrap gap-2">
            <StatusBadge status={booking.bookingStatus} />
            <StatusBadge status={booking.paymentStatus} />
          </div>
        </div>

        <div className="mt-4 grid gap-4 rounded-xl bg-stone-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-bold text-stone-400">
              Guest
            </p>

            <p className="mt-2 flex items-center gap-1.5 text-xs font-extrabold text-stone-700">
              <UserRound size={14} />
              {guest.name || booking.guestName}
            </p>

            {(guest.email || booking.guestEmail) && (
              <a
                href={
                  'mailto:' +
                  (guest.email || booking.guestEmail)
                }
                className="mt-2 flex items-center gap-1.5 text-xs text-stone-600 hover:text-emerald-800"
              >
                <Mail size={13} />
                {guest.email || booking.guestEmail}
              </a>
            )}

            {(guest.phone || booking.guestPhone) && (
              <a
                href={
                  'tel:' +
                  (guest.phone || booking.guestPhone)
                }
                className="mt-2 flex items-center gap-1.5 text-xs text-stone-600 hover:text-emerald-800"
              >
                <Phone size={13} />
                {guest.phone || booking.guestPhone}
              </a>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-stone-400">
              Stay
            </p>

            <p className="mt-2 text-xs font-extrabold leading-5 text-stone-700">
              {formatDate(booking.checkInDate)} –{' '}
              {formatDate(booking.checkOutDate)}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-stone-400">
              Duration
            </p>

            <p className="mt-2 text-xs font-extrabold text-stone-700">
              {booking.numberOfNights}{' '}
              {booking.numberOfNights === 1
                ? 'night'
                : 'nights'}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-stone-400">
              Booking total
            </p>

            <p className="mt-2 text-sm font-black text-emerald-950">
              {formatMoney(
                booking.totalPrice,
                booking.currency,
              )}
            </p>
          </div>
        </div>

        {booking.message && (
          <p className="mt-4 rounded-xl border border-stone-200 p-3 text-xs leading-5 text-stone-600">
            <strong className="text-stone-800">
              Guest note:
            </strong>{' '}
            {booking.message}
          </p>
        )}

        <BookingDeadlines booking={booking} />

        {(booking.bookingRejectionReason ||
          booking.bookingCancellationReason ||
          booking.receiptRejectionReason) && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700">
            Reason:{' '}
            {booking.bookingRejectionReason ||
              booking.bookingCancellationReason ||
              booking.receiptRejectionReason}
          </p>
        )}

        {booking.bookingStatus === 'pending' && (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800">
            This booking is awaiting a decision from the listing agent.
            Administrators cannot approve or reject the initial request.
          </p>
        )}

        {booking.bookingStatus === 'approved' &&
          booking.paymentStatus === 'unpaid' && (
            <p className="mt-4 rounded-xl bg-stone-50 p-3 text-xs font-semibold leading-5 text-stone-600">
              The booking is approved and is awaiting payment from the guest.
            </p>
          )}

        {receiptRequiresReview && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-black text-amber-900">
              Payment receipt requires verification
            </p>

            {booking.receiptUploadedAt && (
              <p className="mt-1 text-xs text-amber-800">
                Uploaded{' '}
                {formatDateTime(booking.receiptUploadedAt)}
              </p>
            )}

            {booking.paymentReceipt ? (
              <a
                href={booking.paymentReceipt}
                target="_blank"
                rel="noreferrer"
                className="focus-ring mt-3 flex w-fit items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-extrabold text-emerald-900"
              >
                <ExternalLink size={14} />
                Open payment receipt
              </a>
            ) : (
              <p className="mt-3 text-xs font-semibold text-red-700">
                The booking is marked as having an uploaded receipt, but
                no receipt URL is available.
              </p>
            )}
          </div>
        )}

        {booking.paymentStatus === 'verified' && (
          <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-800">
            Payment has been verified for this booking.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-start gap-2">
          {receiptRequiresReview && booking.paymentReceipt && (
            <ConfirmAction
              buttonLabel="Verify receipt"
              confirmLabel="Verify payment"
              description="Confirm that the transfer amount, recipient, date, and reference match this booking."
              isPending={mutations.verify.isPending}
              onConfirm={() =>
                runAction(
                  () =>
                    mutations.verify.mutateAsync(
                      booking._id,
                    ),
                  'Payment receipt verified',
                  'Unable to verify this payment receipt.',
                )
              }
            />
          )}

          {receiptRequiresReview && (
            <ReasonAction
              buttonLabel="Reject receipt"
              confirmLabel="Reject receipt"
              reasonLabel="Reason for rejecting this receipt"
              minimumLength={3}
              isPending={mutations.rejectReceipt.isPending}
              onConfirm={(reason) =>
                runAction(
                  () =>
                    mutations.rejectReceipt.mutateAsync({
                      bookingId: booking._id,
                      reason,
                    }),
                  'Receipt rejected; the guest can upload another receipt',
                  'Unable to reject this payment receipt.',
                )
              }
            />
          )}

          {canCancel && (
            <ReasonAction
              buttonLabel="Cancel booking"
              confirmLabel="Confirm cancellation"
              reasonLabel="Administrative cancellation reason"
              minimumLength={3}
              isPending={mutations.cancel.isPending}
              onConfirm={(reason) =>
                runAction(
                  () =>
                    mutations.cancel.mutateAsync({
                      bookingId: booking._id,
                      reason,
                    }),
                  'Booking cancelled',
                  'Unable to cancel this booking.',
                )
              }
            />
          )}
        </div>
      </div>
    </article>
  )
}

function BookingDeadlines({ booking }) {
  const deadlines = [
    booking.requestExpiresAt && {
      label: 'Agent response deadline',
      value: booking.requestExpiresAt,
    },
    booking.paymentDueAt && {
      label: 'Payment deadline',
      value: booking.paymentDueAt,
    },
    booking.receiptReuploadDeadline && {
      label: 'Receipt re-upload deadline',
      value: booking.receiptReuploadDeadline,
    },
  ].filter(Boolean)

  if (deadlines.length === 0) return null

  return (
    <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
      {deadlines.map((deadline) => (
        <div
          key={deadline.label}
          className="rounded-xl bg-stone-50 p-3 text-stone-600"
        >
          <p className="flex items-center gap-1.5 font-bold text-stone-400">
            <Clock3 size={14} />
            {deadline.label}
          </p>

          <p className="mt-2 font-extrabold text-stone-700">
            {formatDateTime(deadline.value)}
          </p>
        </div>
      ))}
    </div>
  )
}

export default AdminBookingsPage