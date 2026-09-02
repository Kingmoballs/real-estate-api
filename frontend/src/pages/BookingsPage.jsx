import {
  AlertTriangle,
  CalendarRange,
  Clock3,
  CreditCard,
  LoaderCircle,
  MapPin,
  Upload,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import ActivityPagination from '../components/activity/ActivityPagination.jsx'
import ReasonAction from '../components/activity/ReasonAction.jsx'
import StatusBadge from '../components/activity/StatusBadge.jsx'
import PropertyImage from '../components/property/PropertyImage.jsx'
import {
  formatDate,
  formatDateTime,
  formatMoney,
} from '../features/activity/activityFormatters.js'
import {
  useCancelBooking,
  useMyBookings,
  useUploadBookingReceipt,
} from '../features/bookings/bookingApi.js'
import {
  getPropertyId,
  getPropertyLocation,
} from '../features/properties/propertyFormatters.js'
import { getApiErrorMessage } from '../lib/errors.js'

const bookingStatuses = [
  ['', 'All bookings'],
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['active', 'Active'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
  ['rejected', 'Rejected'],
  ['expired', 'Expired'],
]

const acceptedReceiptTypes = [
  'image/jpeg',
  'image/png',
  'application/pdf',
]

function ReceiptUpload({ booking }) {
  const mutation = useUploadBookingReceipt()
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null
    setFileError('')

    if (nextFile && !acceptedReceiptTypes.includes(nextFile.type)) {
      setFile(null)
      setFileError('Choose a JPG, PNG, or PDF receipt.')
      return
    }

    if (nextFile && nextFile.size > 5 * 1024 * 1024) {
      setFile(null)
      setFileError('The receipt must not exceed 5 MB.')
      return
    }

    setFile(nextFile)
  }

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!file) return

    try {
      await mutation.mutateAsync({ bookingId: booking._id, file })
      setFile(null)
      toast.success('Payment receipt uploaded for review')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to upload receipt.'))
    }
  }

  return (
    <form
      onSubmit={handleUpload}
      className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"
    >
      <p className="flex items-center gap-2 text-xs font-black text-amber-900">
        <CreditCard size={16} /> Payment receipt required
      </p>
      {booking.paymentDueAt && (
        <p className="mt-1 text-xs leading-5 text-amber-800">
          Upload before {formatDateTime(booking.paymentDueAt)}.
        </p>
      )}
      {booking.receiptRejectionReason && (
        <p className="mt-2 text-xs leading-5 text-red-700">
          Previous receipt issue: {booking.receiptRejectionReason}
        </p>
      )}
      <label className="mt-3 block text-xs font-extrabold text-stone-600">
        JPG, PNG, or PDF · maximum 5 MB
        <input
          type="file"
          required
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          onChange={handleFileChange}
          className="mt-2 block w-full text-xs text-stone-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-extrabold file:text-emerald-900"
        />
      </label>
      {fileError && (
        <p role="alert" className="mt-2 text-xs font-semibold text-red-700">
          {fileError}
        </p>
      )}
      <button
        type="submit"
        disabled={!file || mutation.isPending}
        className="focus-ring mt-3 flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-950 px-3 py-2 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mutation.isPending ? (
          <LoaderCircle size={15} className="animate-spin" />
        ) : (
          <Upload size={15} />
        )}
        {mutation.isPending ? 'Uploading…' : 'Upload receipt'}
      </button>
    </form>
  )
}

function BookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(Number(searchParams.get('page')) || 1, 1)
  const status = searchParams.get('status') || ''
  const params = { page, limit: 8 }
  if (status) params.status = status

  const { data, error, isError, isFetching, isLoading, refetch } =
    useMyBookings(params)
  const cancelMutation = useCancelBooking()
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

  const handleCancel = async (bookingId, reason) => {
    try {
      await cancelMutation.mutateAsync({ bookingId, reason })
      toast.success('Booking request cancelled')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to cancel booking.'))
      throw error
    }
  }

  return (
    <main className="page-shell py-10 sm:py-14">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Shortlet activity</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] text-stone-900 sm:text-5xl">
            My bookings
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
            Track booking approval, payment verification, and upcoming stays.
          </p>
        </div>
        <Link
          to="/account"
          className="focus-ring w-fit rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-black text-stone-700"
        >
          Back to my account
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4">
        <span className="flex items-center gap-2 text-sm font-black text-stone-700">
          <CalendarRange size={18} className="text-amber-700" />
          Booking history
        </span>
        <label className="flex items-center gap-2 text-xs font-extrabold text-stone-500">
          Status
          <select
            value={status}
            onChange={(event) =>
              updateParams({ status: event.target.value, page: null })
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
            {getApiErrorMessage(error, 'Unable to load bookings.')}
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

      {!isLoading && !isError && bookings.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <CalendarRange className="mx-auto text-stone-400" size={34} />
          <h2 className="mt-4 text-xl font-black text-stone-900">
            No bookings found
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            Check availability on a published shortlet to send your first
            request.
          </p>
          <Link
            to="/properties?listingType=shortlet"
            className="focus-ring mt-5 inline-block rounded-xl bg-emerald-950 px-5 py-3 text-sm font-black text-white"
          >
            Explore shortlets
          </Link>
        </div>
      )}

      {!isLoading && !isError && bookings.length > 0 && (
        <div
          className={
            'mt-6 space-y-5 transition-opacity ' +
            (isFetching ? 'opacity-60' : '')
          }
        >
          {bookings.map((booking) => {
            const property = booking.property
            const propertyId = getPropertyId(property)
            const canCancel =
              ['pending', 'approved'].includes(booking.bookingStatus) &&
              !['receiptUploaded', 'verified'].includes(booking.paymentStatus)
            const canUploadReceipt =
              booking.bookingStatus === 'approved' &&
              ['unpaid', 'rejected'].includes(booking.paymentStatus)

            return (
              <article
                key={booking._id}
                className="grid gap-5 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-[180px_1fr] md:p-5"
              >
                <PropertyImage
                  property={property}
                  className="aspect-[4/3] w-full rounded-xl md:aspect-square"
                  sizes="180px"
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
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={booking.bookingStatus} />
                      <StatusBadge status={booking.paymentStatus} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-xl bg-stone-50 p-4 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-bold text-stone-400">Stay</p>
                      <p className="mt-1 font-extrabold text-stone-700">
                        {formatDate(booking.checkInDate)} –{' '}
                        {formatDate(booking.checkOutDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-400">Duration</p>
                      <p className="mt-1 font-extrabold text-stone-700">
                        {booking.numberOfNights}{' '}
                        {booking.numberOfNights === 1 ? 'night' : 'nights'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-400">Total</p>
                      <p className="mt-1 font-extrabold text-emerald-950">
                        {formatMoney(booking.totalPrice, booking.currency)}
                      </p>
                    </div>
                  </div>

                  {booking.bookingStatus === 'pending' &&
                    booking.requestExpiresAt && (
                      <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-stone-500">
                        <Clock3 size={14} />
                        Agent response window ends{' '}
                        {formatDateTime(booking.requestExpiresAt)}
                      </p>
                    )}

                  {(booking.bookingRejectionReason ||
                    booking.bookingCancellationReason) && (
                    <p className="mt-3 text-xs leading-5 text-red-700">
                      Reason:{' '}
                      {booking.bookingRejectionReason ||
                        booking.bookingCancellationReason}
                    </p>
                  )}

                  {canUploadReceipt && <ReceiptUpload booking={booking} />}

                  {booking.paymentStatus === 'receiptUploaded' && (
                    <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800">
                      Your receipt is awaiting verification. Cancellation now
                      requires support review.
                    </p>
                  )}

                  {canCancel && (
                    <div className="mt-3">
                      <ReasonAction
                        buttonLabel="Cancel booking"
                        confirmLabel="Confirm cancellation"
                        isPending={cancelMutation.isPending}
                        onConfirm={(reason) =>
                          handleCancel(booking._id, reason)
                        }
                      />
                    </div>
                  )}
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
          onPageChange={(nextPage) => updateParams({ page: nextPage })}
        />
      )}
    </main>
  )
}

export default BookingsPage
