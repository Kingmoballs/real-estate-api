import { DayPicker } from '@daypicker/react'
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  LoaderCircle,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { toast } from 'sonner'
import useAuth from '../../features/auth/useAuth.js'
import {
  useBookingAvailability,
  useBookingAvailabilityCalendar,
  useCreateBooking,
} from '../../features/bookings/bookingApi.js'
import { formatMoney } from '../../features/activity/activityFormatters.js'
import { getApiErrorMessage } from '../../lib/errors.js'

const toDateOnly = (date) => {
  const pad = (value) =>
    String(value).padStart(2, '0')

  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
  ].join('')
}

const parseDateOnly = (value) => {
  if (!value) return null

  const [year, month, day] = value
    .split('-')
    .map(Number)

  const date = new Date(
    year,
    month - 1,
    day,
  )

  return Number.isNaN(date.getTime())
    ? null
    : date
}

const addDays = (date, numberOfDays) => {
  const nextDate = new Date(date)

  nextDate.setDate(
    nextDate.getDate() + numberOfDays,
  )

  return nextDate
}

const getNumberOfNights = (
  checkInDate,
  checkOutDate,
) => {
  if (!checkInDate || !checkOutDate) {
    return 0
  }

  const start = parseDateOnly(checkInDate)
  const end = parseDateOnly(checkOutDate)

  if (!start || !end || end <= start) {
    return 0
  }

  return Math.round(
    (end - start) / 86400000,
  )
}

const formatSelectedDate = (date) => {
  if (!date) return 'Not selected'

  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
  }).format(date)
}

const buildBlockedMatchers = (
  blockedRanges = [],
) => {
  const all = []
  const held = []
  const booked = []

  blockedRanges.forEach((range) => {
    const checkIn =
      parseDateOnly(range.checkInDate)
    const checkOut =
      parseDateOnly(range.checkOutDate)

    if (!checkIn || !checkOut) return

    /*
     * A guest occupies the property from check-in
     * until the night before check-out.
     */
    const lastOccupiedNight =
      addDays(checkOut, -1)

    const matcher = {
      from: checkIn,
      to: lastOccupiedNight,
    }

    all.push(matcher)

    if (range.status === 'pending') {
      held.push(matcher)
    } else {
      booked.push(matcher)
    }
  })

  return {
    all,
    held,
    booked,
  }
}

function BookingRequestForm({ property }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const availabilityMutation =
    useBookingAvailability()
  const bookingMutation =
    useCreateBooking()

  const [selectedRange, setSelectedRange] =
    useState()
  const [message, setMessage] =
    useState('')

  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const calendarEnd = useMemo(
    () => addDays(today, 365),
    [today],
  )

  const calendarFrom = toDateOnly(today)
  const calendarTo =
    toDateOnly(calendarEnd)

  const calendarQuery =
    useBookingAvailabilityCalendar({
      propertyId: property._id,
      from: calendarFrom,
      to: calendarTo,
    })

  const blockedDates = useMemo(
    () =>
      buildBlockedMatchers(
        calendarQuery.data?.blockedRanges,
      ),
    [calendarQuery.data?.blockedRanges],
  )

  const checkInDate =
    selectedRange?.from
      ? toDateOnly(selectedRange.from)
      : ''

  const checkOutDate =
    selectedRange?.to
      ? toDateOnly(selectedRange.to)
      : ''

  const numberOfNights =
    getNumberOfNights(
      checkInDate,
      checkOutDate,
    )

  const estimatedTotal =
    numberOfNights *
    Number(property.price || 0)

  const availability =
    availabilityMutation.data

  const handleRangeSelect = (
    nextRange,
  ) => {
    setSelectedRange(nextRange)
    availabilityMutation.reset()
  }

  const handleAvailabilityCheck =
    async (event) => {
      event.preventDefault()

      if (
        !checkInDate ||
        !checkOutDate ||
        numberOfNights < 1
      ) {
        toast.error(
          'Choose a valid check-in and check-out date.',
        )
        return
      }

      try {
        const result =
          await availabilityMutation.mutateAsync({
            propertyId: property._id,
            checkInDate,
            checkOutDate,
          })

        if (result.available) {
          toast.success(
            'This shortlet is available for the selected dates',
          )
        }
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            'Unable to check availability.',
          ),
        )
      }
    }

  const handleBooking = async () => {
    try {
      await bookingMutation.mutateAsync({
        property: property._id,
        checkInDate,
        checkOutDate,
        message: message.trim(),
      })

      toast.success(
        'Booking request sent to the agent',
      )

      navigate('/bookings')
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to create booking.',
        ),
      )
    }
  }

  return (
    <form
      onSubmit={handleAvailabilityCheck}
      className="rounded-[1.6rem] border border-stone-200 bg-white p-6 shadow-sm"
    >
      <CalendarRange
        className="text-amber-700"
        size={24}
      />

      <h2 className="mt-4 text-lg font-black text-stone-900">
        Check shortlet availability
      </h2>

      <p className="mt-2 text-xs leading-5 text-stone-500">
        Choose your check-in and check-out
        dates. Unavailable dates cannot be
        selected.
      </p>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-stone-200 bg-stone-50 p-3">
        {calendarQuery.isLoading && (
          <div className="grid h-80 place-items-center">
            <p className="flex items-center gap-2 text-sm font-bold text-stone-500">
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
              Loading available dates…
            </p>
          </div>
        )}

        {calendarQuery.isError && (
          <div className="grid min-h-64 place-items-center px-4 text-center">
            <div>
              <AlertTriangle
                className="mx-auto text-red-700"
                size={25}
              />

              <p className="mt-3 text-sm font-semibold text-red-700">
                {getApiErrorMessage(
                  calendarQuery.error,
                  'Unable to load the availability calendar.',
                )}
              </p>

              <button
                type="button"
                onClick={() =>
                  calendarQuery.refetch()
                }
                className="focus-ring mt-4 cursor-pointer rounded-lg bg-emerald-950 px-4 py-2 text-xs font-black text-white"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {!calendarQuery.isLoading &&
          !calendarQuery.isError && (
            <DayPicker
              animate
              mode="range"
              min={1}
              resetOnSelect
              excludeDisabled
              selected={selectedRange}
              onSelect={handleRangeSelect}
              defaultMonth={
                selectedRange?.from || today
              }
              startMonth={today}
              endMonth={calendarEnd}
              disabled={[
                { before: today },
                { after: calendarEnd },
                ...blockedDates.all,
              ]}
              modifiers={{
                held: blockedDates.held,
                booked: blockedDates.booked,
              }}
              modifiersClassNames={{
                held:
                  'booking-calendar-held',
                booked:
                  'booking-calendar-booked',
              }}
              showOutsideDays
              className="booking-calendar"
              aria-label="Choose check-in and check-out dates"
            />
          )}
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold">
        <span className="flex items-center gap-2 text-stone-600">
          <span className="size-3 rounded-full bg-white ring-1 ring-stone-300" />
          Available
        </span>

        <span className="flex items-center gap-2 text-amber-800">
          <span className="size-3 rounded-full bg-amber-200" />
          Temporarily held
        </span>

        <span className="flex items-center gap-2 text-red-700">
          <span className="size-3 rounded-full bg-red-200" />
          Unavailable
        </span>
      </div>

      {(selectedRange?.from ||
        selectedRange?.to) && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-stone-100 p-3">
            <p className="text-xs font-bold text-stone-400">
              Check-in
            </p>

            <p className="mt-1 text-sm font-black text-stone-800">
              {formatSelectedDate(
                selectedRange?.from,
              )}
            </p>
          </div>

          <div className="rounded-xl bg-stone-100 p-3">
            <p className="text-xs font-bold text-stone-400">
              Check-out
            </p>

            <p className="mt-1 text-sm font-black text-stone-800">
              {formatSelectedDate(
                selectedRange?.to,
              )}
            </p>
          </div>
        </div>
      )}

      {numberOfNights > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-stone-100 px-4 py-3 text-xs">
          <span className="font-bold text-stone-500">
            {numberOfNights}{' '}
            {numberOfNights === 1
              ? 'night'
              : 'nights'}
          </span>

          <span className="font-black text-emerald-950">
            Estimated{' '}
            {formatMoney(
              estimatedTotal,
              property.currency,
            )}
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={
          numberOfNights < 1 ||
          availabilityMutation.isPending ||
          calendarQuery.isFetching
        }
        className="focus-ring mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-800 px-4 py-3 text-sm font-black text-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {availabilityMutation.isPending && (
          <LoaderCircle
            size={17}
            className="animate-spin"
          />
        )}

        {availabilityMutation.isPending
          ? 'Checking dates…'
          : 'Check availability'}
      </button>

      {availability && (
        <div
          className={
            'mt-4 rounded-xl p-4 text-sm ' +
            (availability.available
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-700')
          }
        >
          <p className="flex items-center gap-2 font-black">
            {availability.available ? (
              <CheckCircle2 size={18} />
            ) : (
              <XCircle size={18} />
            )}

            {availability.available
              ? 'Available for these dates'
              : 'These dates are unavailable'}
          </p>

          {!availability.available && (
            <p className="mt-1 text-xs">
              Availability may have changed.
              Select another date range.
            </p>
          )}
        </div>
      )}

      {availability?.available &&
        user?.role === 'user' && (
          <>
            <label className="mt-4 block text-xs font-extrabold text-stone-600">
              Message to the host

              <textarea
                maxLength={1000}
                rows={3}
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value,
                  )
                }
                placeholder="Optional arrival notes or questions"
                className="focus-ring mt-2 w-full resize-y rounded-xl border border-stone-300 p-3 text-sm font-normal"
              />
            </label>

            <button
              type="button"
              disabled={
                bookingMutation.isPending
              }
              onClick={handleBooking}
              className="focus-ring mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-black text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {bookingMutation.isPending && (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              )}

              {bookingMutation.isPending
                ? 'Sending request…'
                : 'Send booking request'}
            </button>
          </>
        )}

      {availability?.available &&
        !user && (
          <Link
            to="/login"
            state={{ from: location }}
            className="focus-ring mt-4 block rounded-xl bg-emerald-950 px-4 py-3 text-center text-sm font-black text-white"
          >
            Sign in to book
          </Link>
        )}

      {availability?.available &&
        user &&
        user.role !== 'user' && (
          <p className="mt-4 rounded-xl bg-stone-100 p-3 text-xs font-semibold leading-5 text-stone-600">
            Booking requests are available
            from regular customer accounts.
          </p>
        )}
    </form>
  )
}

export default BookingRequestForm