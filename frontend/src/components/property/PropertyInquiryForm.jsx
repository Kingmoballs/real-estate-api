import {
  LoaderCircle,
  MessageCircle,
} from 'lucide-react'
import { useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { toast } from 'sonner'
import useAuth from '../../features/auth/useAuth.js'
import { useSendChatMessage } from '../../features/chat/chatApi.js'
import { getApiErrorMessage } from '../../lib/errors.js'

const inquiryTypes = [
  {
    value: 'general',
    label: 'General question',
  },
  {
    value: 'availability',
    label: 'Availability',
  },
  {
    value: 'viewing',
    label: 'Property viewing',
  },
  {
    value: 'price',
    label: 'Price or payment',
  },
]

function PropertyInquiryForm({
  property,
}) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const sendMessage =
    useSendChatMessage()

  const [inquiryType, setInquiryType] =
    useState('general')

  const [content, setContent] =
    useState('')

  if (!user) {
    return (
      <section className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-6">
        <MessageCircle
          size={24}
          className="text-emerald-800"
        />

        <h2 className="mt-4 text-lg font-black text-stone-900">
          Ask the agent
        </h2>

        <p className="mt-2 text-sm leading-6 text-stone-600">
          Sign in to send a secure
          message about this property.
        </p>

        <Link
          to="/login"
          state={{ from: location }}
          className="focus-ring mt-5 block rounded-xl bg-emerald-950 px-4 py-3 text-center text-sm font-black text-white"
        >
          Sign in to message agent
        </Link>
      </section>
    )
  }

  if (user.role !== 'user') {
    return (
      <section className="rounded-[1.6rem] border border-stone-200 bg-white p-6">
        <MessageCircle
          size={24}
          className="text-stone-400"
        />

        <p className="mt-4 text-sm font-semibold leading-6 text-stone-500">
          Property inquiries can only
          be started from a customer
          account.
        </p>
      </section>
    )
  }

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault()

    const trimmedContent =
      content.trim()

    if (
      trimmedContent.length < 3
    ) {
      toast.error(
        'Your message must contain at least 3 characters.',
      )
      return
    }

    try {
      const result =
        await sendMessage.mutateAsync({
          propertyId: property._id,
          inquiryType,
          content: trimmedContent,
        })

      toast.success(
        'Your message was sent to the agent',
      )

      navigate(
        '/messages/' +
          result.conversationId,
      )
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to send your message.',
        ),
      )
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm"
    >
      <MessageCircle
        size={24}
        className="text-emerald-800"
      />

      <h2 className="mt-4 text-lg font-black text-stone-900">
        Message the agent
      </h2>

      <p className="mt-2 text-xs leading-5 text-stone-600">
        Ask about availability,
        pricing, inspections, or other
        property details.
      </p>

      <label className="mt-5 block text-xs font-extrabold text-stone-700">
        What is your question about?

        <select
          value={inquiryType}
          onChange={(event) =>
            setInquiryType(
              event.target.value,
            )
          }
          className="focus-ring mt-2 h-12 w-full cursor-pointer rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800"
        >
          {inquiryTypes.map(
            (inquiryTypeOption) => (
              <option
                key={
                  inquiryTypeOption.value
                }
                value={
                  inquiryTypeOption.value
                }
              >
                {
                  inquiryTypeOption.label
                }
              </option>
            ),
          )}
        </select>
      </label>

      <label className="mt-4 block text-xs font-extrabold text-stone-700">
        Message

        <textarea
          required
          minLength={3}
          maxLength={2000}
          rows={4}
          value={content}
          onChange={(event) =>
            setContent(
              event.target.value,
            )
          }
          placeholder="Hello, is this property still available?"
          className="focus-ring mt-2 w-full resize-y rounded-xl border border-stone-300 bg-white p-3 text-sm font-normal leading-6"
        />
      </label>

      <div className="mt-1 text-right text-xs font-semibold text-stone-400">
        {content.length}/2000
      </div>

      <button
        type="submit"
        disabled={
          sendMessage.isPending
        }
        className="focus-ring mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-950 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sendMessage.isPending && (
          <LoaderCircle
            size={17}
            className="animate-spin"
          />
        )}

        {sendMessage.isPending
          ? 'Sending message...'
          : 'Send message'}
      </button>
    </form>
  )
}

export default PropertyInquiryForm