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
  useAgentBookings,
  useApproveBooking,
  useCancelBooking,
  useRejectBooking,
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
  ['', 'All payment statuses'],
  ['unpaid', 'Unpaid'],
  ['receiptUploaded', 'Receipt uploaded'],
  ['verified', 'Verified'],
  ['rejected', 'Receipt rejected'],
]

function AgentBookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(Number(searchParams.get('page')) || 1, 1)
  const status = searchParams.get('status') || ''
  const paymentStatus = searchParams.get('paymentStatus') || ''
  const params = { page, limit: 8 }
  if (status) params.status = status
  if (paymentStatus) params.paymentStatus = paymentStatus

  const { data, error, isError, isFetching, isLoading, refetch } =
    useAgentBookings(params)
  const approveMutation = useApproveBooking()
  const rejectMutation = useRejectBooking()
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

  const runAction = async (operation, successMessage, fallbackMessage) => {
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
          Booking requests
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
          Review stay requests, manage payment deadlines, and verify uploaded
          receipts.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-stone-200 bg-white p-4">
        <label className="text-xs font-extrabold text-stone-500">
          Booking
          <select
            value={status}
            onChange={(event) =>
              updateParams({ status: event.target.value, page: null })
            }
            className="focus-ring ml-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
          >
            {bookingStatuses.map(([value, label]) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-extrabold text-stone-500">
          Payment
          <select
            value={paymentStatus}
            onChange={(event) =>
              updateParams({ paymentStatus: event.target.value, page: null })
            }
            className="focus-ring ml-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
          >
            {paymentStatuses.map(([value, label]) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <BookingLoading />}
      {isError && <BookingError error={error} onRetry={() => refetch()} />}
      {!isLoading && !isError && bookings.length === 0 && <BookingEmpty />}

      {!isLoading && !isError && bookings.length > 0 && (
        <div
          className={
            'mt-6 space-y-5 transition-opacity ' +
            (isFetching ? 'opacity-60' : '')
          }
        >
          {bookings.map((booking) => (
            <BookingManagementCard
              key={booking._id}
              booking={booking}
              mutations={{
                approve: approveMutation,
                reject: rejectMutation,
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
          onPageChange={(nextPage) => updateParams({ page: nextPage })}
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
          className="h-72 animate-pulse rounded-2xl border border-stone-200 bg-white"
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
        {getApiErrorMessage(error, 'Unable to load booking requests.')}
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

function BookingEmpty() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
      <CalendarRange className="mx-auto text-stone-400" size={36} />
      <h3 className="mt-4 text-xl font-black text-stone-900">
        No bookings found
      </h3>
      <p className="mt-2 text-sm text-stone-500">
        Booking requests for your published shortlets appear here.
      </p>
    </div>
  )
}

function BookingManagementCard({ booking, mutations, runAction }) {
  const property = booking.property
  const propertyId = getPropertyId(property)
  const guest = booking.guest || {}
  const canCancel =
    ['pending', 'approved'].includes(booking.bookingStatus) &&
    !['receiptUploaded', 'verified'].includes(booking.paymentStatus)
  const receiptRequiresReview =
    booking.bookingStatus === 'approved' &&
    booking.paymentStatus === 'receiptUploaded'

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
              to={'/agent/properties/' + propertyId + '/edit'}
              className="focus-ring text-lg font-black text-stone-900 hover:text-emerald-800"
            >
              {property.title}
            </Link>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
              <MapPin size={14} /> {getPropertyLocation(property)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={booking.bookingStatus} />
            <StatusBadge status={booking.paymentStatus} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 rounded-xl bg-stone-50 p-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-bold text-stone-400">Guest</p>
            <p className="mt-1 flex items-center gap-1.5 font-extrabold text-stone-700">
              <UserRound size={14} /> {guest.name || booking.guestName}
            </p>
            <a
              href={'mailto:' + (guest.email || booking.guestEmail)}
              className="mt-1 flex items-center gap-1.5 text-stone-600 hover:text-emerald-800"
            >
              <Mail size={13} /> {guest.email || booking.guestEmail}
            </a>
            <a
              href={'tel:' + (guest.phone || booking.guestPhone)}
              className="mt-1 flex items-center gap-1.5 text-stone-600 hover:text-emerald-800"
            >
              <Phone size={13} /> {guest.phone || booking.guestPhone}
            </a>
          </div>
          <div>
            <p className="font-bold text-stone-400">Stay</p>
            <p className="mt-1 font-extrabold leading-5 text-stone-700">
              {formatDate(booking.checkInDate)} –{' '}
              {formatDate(booking.checkOutDate)}
            </p>
          </div>
          <div>
            <p className="font-bold text-stone-400">Duration</p>
            <p className="mt-1 font-extrabold text-stone-700">
              {booking.numberOfNights}{' '}
              {booking.numberOfNights === 1 ? 'night' : 'nights'}
            </p>
          </div>
          <div>
            <p className="font-bold text-stone-400">Total</p>
            <p className="mt-1 font-extrabold text-emerald-950">
              {formatMoney(booking.totalPrice, booking.currency)}
            </p>
          </div>
        </div>

        {booking.message && (
          <p className="mt-3 text-xs leading-5 text-stone-600">
            Guest note: {booking.message}
          </p>
        )}
        {booking.bookingStatus === 'pending' && booking.requestExpiresAt && (
          <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-stone-500">
            <Clock3 size={14} /> Respond before{' '}
            {formatDateTime(booking.requestExpiresAt)}
          </p>
        )}
        {booking.bookingStatus === 'approved' && booking.paymentDueAt && (
          <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-stone-500">
            <CreditCard size={14} /> Payment deadline{' '}
            {formatDateTime(booking.paymentDueAt)}
          </p>
        )}
        {(booking.bookingRejectionReason ||
          booking.bookingCancellationReason ||
          booking.receiptRejectionReason) && (
          <p className="mt-3 text-xs leading-5 text-red-700">
            Reason:{' '}
            {booking.bookingRejectionReason ||
              booking.bookingCancellationReason ||
              booking.receiptRejectionReason}
          </p>
        )}

        {receiptRequiresReview && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-black text-amber-900">
              Payment receipt is ready for review
            </p>
            {booking.paymentReceipt && (
              <a
                href={booking.paymentReceipt}
                target="_blank"
                rel="noreferrer"
                className="focus-ring mt-2 flex w-fit items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-extrabold text-emerald-900"
              >
                <ExternalLink size={14} /> Open receipt
              </a>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-start gap-2">
          {booking.bookingStatus === 'pending' && (
            <ConfirmAction
              buttonLabel="Approve booking"
              confirmLabel="Approve and start payment window"
              description="The guest will receive a payment deadline after approval."
              isPending={mutations.approve.isPending}
              onConfirm={() =>
                runAction(
                  () => mutations.approve.mutateAsync(booking._id),
                  'Booking approved and payment window started',
                  'Unable to approve booking.',
                )
              }
            />
          )}
          {booking.bookingStatus === 'pending' && (
            <ReasonAction
              buttonLabel="Reject booking"
              confirmLabel="Confirm rejection"
              reasonLabel="Reason for rejection"
              isPending={mutations.reject.isPending}
              onConfirm={(reason) =>
                runAction(
                  () =>
                    mutations.reject.mutateAsync({
                      bookingId: booking._id,
                      reason,
                    }),
                  'Booking rejected',
                  'Unable to reject booking.',
                )
              }
            />
          )}
          {receiptRequiresReview && (
            <ConfirmAction
              buttonLabel="Verify receipt"
              confirmLabel="Verify payment"
              description="Confirm that the amount and transfer details match this booking."
              isPending={mutations.verify.isPending}
              onConfirm={() =>
                runAction(
                  () => mutations.verify.mutateAsync(booking._id),
                  'Payment receipt verified',
                  'Unable to verify receipt.',
                )
              }
            />
          )}
          {receiptRequiresReview && (
            <ReasonAction
              buttonLabel="Reject receipt"
              confirmLabel="Reject receipt"
              reasonLabel="Receipt rejection reason"
              isPending={mutations.rejectReceipt.isPending}
              onConfirm={(reason) =>
                runAction(
                  () =>
                    mutations.rejectReceipt.mutateAsync({
                      bookingId: booking._id,
                      reason,
                    }),
                  'Receipt rejected; guest can upload another',
                  'Unable to reject receipt.',
                )
              }
            />
          )}
          {canCancel && (
            <ReasonAction
              buttonLabel="Cancel booking"
              confirmLabel="Confirm cancellation"
              isPending={mutations.cancel.isPending}
              onConfirm={(reason) =>
                runAction(
                  () =>
                    mutations.cancel.mutateAsync({
                      bookingId: booking._id,
                      reason,
                    }),
                  'Booking cancelled',
                  'Unable to cancel booking.',
                )
              }
            />
          )}
        </div>
      </div>
    </article>
  )
}

export default AgentBookingsPage
