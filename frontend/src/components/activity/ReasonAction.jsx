import { LoaderCircle, X } from 'lucide-react'
import { useState } from 'react'

function ReasonAction({
  buttonLabel = 'Cancel request',
  confirmLabel = 'Confirm cancellation',
  reasonLabel = 'Reason for cancellation',
  minimumLength = 3,
  isPending,
  onConfirm,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      await onConfirm(reason.trim())
      setReason('')
      setIsOpen(false)
    } catch {
      // The parent displays the error and keeps the form open.
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="focus-ring cursor-pointer rounded-lg px-3 py-2 text-xs font-extrabold text-red-700 hover:bg-red-50"
      >
        {buttonLabel}
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 p-3"
    >
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-extrabold text-red-800">
          {reasonLabel}
        </label>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="focus-ring grid size-7 cursor-pointer place-items-center rounded-lg text-red-700 hover:bg-red-100"
          aria-label="Close reason form"
        >
          <X size={15} />
        </button>
      </div>

      <textarea
        required
        minLength={minimumLength}
        maxLength={500}
        rows={3}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        className="focus-ring mt-2 w-full resize-y rounded-lg border border-red-200 bg-white p-2.5 text-sm text-stone-800"
      />

      <p className="mt-1 text-xs text-red-700">
        Enter at least {minimumLength} characters.
      </p>

      <button
        type="submit"
        disabled={isPending}
        className="focus-ring mt-2 flex cursor-pointer items-center gap-2 rounded-lg bg-red-700 px-3 py-2 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending && <LoaderCircle size={14} className="animate-spin" />}
        {confirmLabel}
      </button>
    </form>
  )
}

export default ReasonAction