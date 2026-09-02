import { LoaderCircle, X } from 'lucide-react'
import { useState } from 'react'

function ConfirmAction({
  buttonLabel,
  confirmLabel = 'Confirm',
  description,
  isPending,
  onConfirm,
  tone = 'neutral',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const isDanger = tone === 'danger'

  const handleConfirm = async () => {
    try {
      await onConfirm()
      setIsOpen(false)
    } catch {
      // The parent displays the API error and keeps confirmation open.
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          'focus-ring cursor-pointer rounded-lg px-3 py-2 text-xs font-extrabold hover:bg-stone-100 ' +
          (isDanger ? 'text-red-700' : 'text-emerald-900')
        }
      >
        {buttonLabel}
      </button>
    )
  }

  return (
    <div
      className={
        'mt-3 rounded-xl border p-3 ' +
        (isDanger
          ? 'border-red-200 bg-red-50'
          : 'border-amber-200 bg-amber-50')
      }
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold leading-5 text-stone-700">
          {description}
        </p>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="focus-ring grid size-7 shrink-0 cursor-pointer place-items-center rounded-lg text-stone-600 hover:bg-white"
          aria-label="Close confirmation"
        >
          <X size={15} />
        </button>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={handleConfirm}
        className={
          'focus-ring mt-3 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60 ' +
          (isDanger ? 'bg-red-700' : 'bg-emerald-950')
        }
      >
        {isPending && <LoaderCircle size={14} className="animate-spin" />}
        {confirmLabel}
      </button>
    </div>
  )
}

export default ConfirmAction
