import { CalendarDays, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import useAuth from '../../features/auth/useAuth.js'
import { useCreateInspection } from '../../features/inspections/inspectionApi.js'
import { getApiErrorMessage } from '../../lib/errors.js'

const toLocalInputValue = (date) => {
  const pad = (value) => String(value).padStart(2, '0')
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
  ].join('')
}

const inspectionFormLoadedAt = Date.now()
const minimumInspectionDate = toLocalInputValue(
  new Date(inspectionFormLoadedAt + (2 * 60 + 5) * 60 * 1000),
)
const maximumInspectionDate = toLocalInputValue(
  new Date(inspectionFormLoadedAt + 90 * 24 * 60 * 60 * 1000),
)

function InspectionRequestForm({ propertyId }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const mutation = useCreateInspection()
  const [requestedFor, setRequestedFor] = useState('')
  const [message, setMessage] = useState('')

  if (!user) {
    return (
      <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50 p-6">
        <CalendarDays className="text-amber-700" size={24} />
        <h2 className="mt-4 text-lg font-black text-stone-900">
          Request an inspection
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Sign in to choose a preferred inspection date and contact the agent.
        </p>
        <Link
          to="/login"
          state={{ from: location }}
          className="focus-ring mt-5 block rounded-xl bg-emerald-950 px-4 py-3 text-center text-sm font-black text-white"
        >
          Sign in to continue
        </Link>
      </div>
    )
  }

  if (user.role !== 'user') {
    return (
      <div className="rounded-[1.6rem] border border-stone-200 bg-white p-6 text-sm leading-6 text-stone-500">
        Inspection requests are available from regular customer accounts.
      </div>
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      await mutation.mutateAsync({
        property: propertyId,
        requestedFor: new Date(requestedFor).toISOString(),
        message: message.trim(),
      })
      toast.success('Inspection request sent to the agent')
      navigate('/account?tab=inspections')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to request inspection.'))
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.6rem] border border-stone-200 bg-white p-6 shadow-sm"
    >
      <CalendarDays className="text-amber-700" size={24} />
      <h2 className="mt-4 text-lg font-black text-stone-900">
        Request an inspection
      </h2>
      <p className="mt-2 text-xs leading-5 text-stone-500">
        Choose a time between 2 hours and 90 days from now. The agent will
        confirm it or propose another time.
      </p>
      <label className="mt-5 block text-xs font-extrabold text-stone-600">
        Preferred date and time
        <input
          type="datetime-local"
          required
          min={minimumInspectionDate}
          max={maximumInspectionDate}
          value={requestedFor}
          onChange={(event) => setRequestedFor(event.target.value)}
          className="focus-ring mt-2 h-12 w-full rounded-xl border border-stone-300 px-3 text-sm font-semibold"
        />
      </label>
      <label className="mt-4 block text-xs font-extrabold text-stone-600">
        Message to the agent
        <textarea
          maxLength={1000}
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Optional questions or access notes"
          className="focus-ring mt-2 w-full resize-y rounded-xl border border-stone-300 p-3 text-sm font-normal"
        />
      </label>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="focus-ring mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-black text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {mutation.isPending && <LoaderCircle size={17} className="animate-spin" />}
        {mutation.isPending ? 'Sending request…' : 'Request inspection'}
      </button>
    </form>
  )
}

export default InspectionRequestForm
