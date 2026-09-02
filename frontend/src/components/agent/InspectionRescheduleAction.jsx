import { CalendarClock, LoaderCircle, X } from 'lucide-react'
import { useState } from 'react'

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

const rescheduleFormLoadedAt = Date.now()
const minimumInspectionDate = toLocalInputValue(
  new Date(rescheduleFormLoadedAt + (2 * 60 + 5) * 60 * 1000),
)
const maximumInspectionDate = toLocalInputValue(
  new Date(rescheduleFormLoadedAt + 90 * 24 * 60 * 60 * 1000),
)

function InspectionRescheduleAction({ isPending, onConfirm }) {
  const [isOpen, setIsOpen] = useState(false)
  const [proposedFor, setProposedFor] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      await onConfirm({
        proposedFor: new Date(proposedFor).toISOString(),
        message: message.trim(),
      })
      setProposedFor('')
      setMessage('')
      setIsOpen(false)
    } catch {
      // The parent displays the API error and keeps the form open for retry.
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="focus-ring flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold text-amber-800 hover:bg-amber-50"
      >
        <CalendarClock size={15} /> Propose new time
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 w-full rounded-xl border border-amber-200 bg-amber-50 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-amber-900">
            Propose another inspection time
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            The customer must accept the new time before it is confirmed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="focus-ring grid size-7 shrink-0 cursor-pointer place-items-center rounded-lg text-amber-800 hover:bg-amber-100"
          aria-label="Close reschedule form"
        >
          <X size={15} />
        </button>
      </div>
      <label className="mt-3 block text-xs font-extrabold text-stone-600">
        Proposed date and time
        <input
          type="datetime-local"
          required
          min={minimumInspectionDate}
          max={maximumInspectionDate}
          value={proposedFor}
          onChange={(event) => setProposedFor(event.target.value)}
          className="focus-ring mt-2 h-11 w-full rounded-lg border border-amber-200 bg-white px-3 text-sm"
        />
      </label>
      <label className="mt-3 block text-xs font-extrabold text-stone-600">
        Message to customer
        <textarea
          maxLength={1000}
          rows={2}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="focus-ring mt-2 w-full resize-y rounded-lg border border-amber-200 bg-white p-2.5 text-sm"
          placeholder="Optional explanation or access note"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="focus-ring mt-3 flex cursor-pointer items-center gap-2 rounded-lg bg-amber-700 px-3 py-2 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending && <LoaderCircle size={14} className="animate-spin" />}
        Send proposal
      </button>
    </form>
  )
}

export default InspectionRescheduleAction
