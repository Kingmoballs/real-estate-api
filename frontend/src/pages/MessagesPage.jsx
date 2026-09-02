import {
  ArrowLeft,
  CheckCheck,
  LoaderCircle,
  Lock,
  MessageCircle,
  RefreshCw,
  Send,
  UserRound,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { toast } from 'sonner'
import ActivityPagination from '../components/activity/ActivityPagination.jsx'
import PropertyImage from '../components/property/PropertyImage.jsx'
import useAuth from '../features/auth/useAuth.js'
import {
  useChatInbox,
  useConversationMessages,
  useMarkConversationAsRead,
  useSendChatMessage,
  useUpdateConversationStatus,
} from '../features/chat/chatApi.js'
import useChatSocket from '../features/chat/useChatSocket.js'
import { getApiErrorMessage } from '../lib/errors.js'

const dateTimeFormatter =
  new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

const timeFormatter =
  new Intl.DateTimeFormat('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  })

const getEntityId = (entity) =>
  entity?._id ||
  entity?.id ||
  entity

const formatDateTime = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return dateTimeFormatter.format(date)
}

const formatMessageTime = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return timeFormatter.format(date)
}

const getOtherParticipant = (
  conversation,
  userId,
) => {
  const agentId = getEntityId(
    conversation.agent,
  )

  return String(agentId) ===
    String(userId)
    ? conversation.customer
    : conversation.agent
}

function ConversationList({
  inboxQuery,
  selectedConversationId,
  userId,
  status,
  onStatusChange,
  onSelect,
  onPageChange,
}) {
  const conversations =
    inboxQuery.data?.conversations ||
    []

  return (
    <aside className="flex min-h-0 flex-col border-r border-stone-200 bg-white">
      <div className="border-b border-stone-200 p-4">
        <div className="flex gap-2">
          {[
            ['all', 'All'],
            ['open', 'Open'],
            ['closed', 'Closed'],
          ].map(
            ([
              statusValue,
              label,
            ]) => (
              <button
                key={statusValue}
                type="button"
                onClick={() =>
                  onStatusChange(
                    statusValue,
                  )
                }
                className={
                  'focus-ring cursor-pointer rounded-full px-3 py-2 text-xs font-black transition ' +
                  (status ===
                  statusValue
                    ? 'bg-emerald-950 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200')
                }
              >
                {label}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {inboxQuery.isLoading && (
          <div className="grid min-h-64 place-items-center">
            <p className="flex items-center gap-2 text-sm font-bold text-stone-500">
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
              Loading conversations...
            </p>
          </div>
        )}

        {inboxQuery.isError && (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-bold text-red-700">
              Conversations could not
              be loaded.
            </p>

            <button
              type="button"
              onClick={() =>
                inboxQuery.refetch()
              }
              className="focus-ring mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-950 px-4 py-2 text-xs font-black text-white"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        )}

        {!inboxQuery.isLoading &&
          !inboxQuery.isError &&
          conversations.length ===
            0 && (
            <div className="px-6 py-14 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-stone-100 text-stone-500">
                <MessageCircle
                  size={22}
                />
              </span>

              <p className="mt-4 font-black text-stone-800">
                No conversations
              </p>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Customer property
                inquiries will appear
                here.
              </p>
            </div>
          )}

        {conversations.map(
          (conversation) => {
            const conversationId =
              getEntityId(
                conversation,
              )

            const otherParticipant =
              getOtherParticipant(
                conversation,
                userId,
              )

            const isSelected =
              String(
                selectedConversationId,
              ) ===
              String(conversationId)

            return (
              <button
                key={conversationId}
                type="button"
                onClick={() =>
                  onSelect(
                    conversationId,
                  )
                }
                className={
                  'focus-ring flex w-full cursor-pointer gap-3 border-b border-stone-100 p-4 text-left transition ' +
                  (isSelected
                    ? 'bg-emerald-50'
                    : 'bg-white hover:bg-stone-50')
                }
              >
                <PropertyImage
                  property={
                    conversation.property ||
                    {
                      title:
                        'Property',
                    }
                  }
                  className="size-14 shrink-0 rounded-xl"
                />

                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="truncate text-sm font-black text-stone-900">
                      {otherParticipant?.name ||
                        'Property inquiry'}
                    </span>

                    {conversation.unreadCount >
                      0 && (
                      <span className="grid min-h-5 min-w-5 shrink-0 place-items-center rounded-full bg-emerald-700 px-1 text-[10px] font-black text-white">
                        {
                          conversation.unreadCount
                        }
                      </span>
                    )}
                  </span>

                  <span className="mt-1 block truncate text-xs font-bold text-stone-500">
                    {conversation.property
                      ?.title ||
                      'Property conversation'}
                  </span>

                  <span className="mt-1 block truncate text-xs text-stone-400">
                    {conversation
                      .lastMessage
                      ?.content ||
                      'No message preview'}
                  </span>
                </span>
              </button>
            )
          },
        )}
      </div>

      <div className="border-t border-stone-200 px-3 pb-4">
        <ActivityPagination
          pagination={
            inboxQuery.data
              ?.pagination
          }
          isFetching={
            inboxQuery.isFetching
          }
          onPageChange={
            onPageChange
          }
        />
      </div>
    </aside>
  )
}

function ConversationThread({
  conversationId,
  conversation,
  user,
  onBack,
}) {
  const messagesQuery =
    useConversationMessages(
      conversationId,
    )

  const sendMessage =
    useSendChatMessage()

  const {
    mutate: markConversationRead,
  } = useMarkConversationAsRead()

  const updateStatus =
    useUpdateConversationStatus()

  const [content, setContent] =
    useState('')

  const endOfMessagesRef =
    useRef(null)

  const userId = getEntityId(user)

  const otherParticipant =
    conversation
      ? getOtherParticipant(
          conversation,
          userId,
        )
      : null

  const messages = useMemo(() => {
    const messageMap = new Map()

    const pages = [
      ...(messagesQuery.data
        ?.pages || []),
    ].reverse()

    pages.forEach((page) => {
      page.messages?.forEach(
        (message) => {
          messageMap.set(
            String(
              getEntityId(message),
            ),
            message,
          )
        },
      )
    })

    return Array.from(
      messageMap.values(),
    ).sort(
      (firstMessage, secondMessage) =>
        new Date(
          firstMessage.createdAt,
        ) -
        new Date(
          secondMessage.createdAt,
        ),
    )
  }, [messagesQuery.data?.pages])

  const latestMessageId =
    getEntityId(
      messages[
        messages.length - 1
      ],
    )

  const isAgent =
    String(
      getEntityId(
        conversation?.agent,
      ),
    ) === String(userId)

  const isClosed =
    conversation?.status ===
    'closed'

  useEffect(() => {
    if (!latestMessageId) {
      return
    }

    endOfMessagesRef.current
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      })
  }, [
    conversationId,
    latestMessageId,
  ])

  useEffect(() => {
    if (
      !conversationId ||
      !latestMessageId
    ) {
      return
    }

    markConversationRead(
      conversationId,
    )
  }, [
    conversationId,
    latestMessageId,
    markConversationRead,
  ])

  const handleSendMessage = async (
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
      await sendMessage.mutateAsync({
        conversationId,
        content: trimmedContent,
      })

      setContent('')
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to send the message.',
        ),
      )
    }
  }

  const handleStatusChange =
    async () => {
      const nextStatus = isClosed
        ? 'open'
        : 'closed'

      try {
        await updateStatus.mutateAsync(
          {
            conversationId,
            status: nextStatus,
          },
        )

        toast.success(
          nextStatus === 'closed'
            ? 'Conversation closed'
            : 'Conversation reopened',
        )
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            'Unable to update the conversation.',
          ),
        )
      }
    }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-stone-50">
      <header className="flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-4 sm:px-5">
        <button
          type="button"
          onClick={onBack}
          className="focus-ring grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border border-stone-300 text-stone-700 lg:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft size={18} />
        </button>

        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-900">
          <UserRound size={19} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-black text-stone-900">
            {otherParticipant?.name ||
              'Property inquiry'}
          </h2>

          {conversation?.property ? (
            <Link
              to={
                '/properties/' +
                conversation.property._id
              }
              className="focus-ring block truncate text-xs font-bold text-emerald-800 hover:underline"
            >
              {
                conversation.property
                  .title
              }
            </Link>
          ) : (
            <p className="text-xs font-bold text-stone-500">
              Conversation
            </p>
          )}
        </div>

        {conversation && (
          <span
            className={
              'hidden rounded-full px-3 py-1.5 text-xs font-black sm:inline-flex ' +
              (isClosed
                ? 'bg-stone-200 text-stone-700'
                : 'bg-emerald-100 text-emerald-800')
            }
          >
            {isClosed
              ? 'Closed'
              : 'Open'}
          </span>
        )}

        {isAgent && conversation && (
          <button
            type="button"
            onClick={
              handleStatusChange
            }
            disabled={
              updateStatus.isPending
            }
            className="focus-ring cursor-pointer rounded-lg border border-stone-300 px-3 py-2 text-xs font-black text-stone-700 hover:border-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updateStatus.isPending
              ? 'Updating...'
              : isClosed
                ? 'Reopen'
                : 'Close'}
          </button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {messagesQuery.hasNextPage && (
          <div className="mb-6 text-center">
            <button
              type="button"
              onClick={() =>
                messagesQuery.fetchNextPage()
              }
              disabled={
                messagesQuery
                  .isFetchingNextPage
              }
              className="focus-ring cursor-pointer rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-black text-stone-600 disabled:opacity-50"
            >
              {messagesQuery
                .isFetchingNextPage
                ? 'Loading...'
                : 'Load older messages'}
            </button>
          </div>
        )}

        {messagesQuery.isLoading && (
          <div className="grid min-h-64 place-items-center">
            <p className="flex items-center gap-2 text-sm font-bold text-stone-500">
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
              Loading messages...
            </p>
          </div>
        )}

        {messagesQuery.isError && (
          <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-sm font-bold text-red-700">
              Messages could not be
              loaded.
            </p>

            <button
              type="button"
              onClick={() =>
                messagesQuery.refetch()
              }
              className="focus-ring mt-4 cursor-pointer rounded-lg bg-red-700 px-4 py-2 text-xs font-black text-white"
            >
              Try again
            </button>
          </div>
        )}

        {!messagesQuery.isLoading &&
          !messagesQuery.isError &&
          messages.length === 0 && (
            <div className="grid min-h-64 place-items-center text-center">
              <div>
                <MessageCircle
                  size={30}
                  className="mx-auto text-stone-400"
                />

                <p className="mt-4 font-black text-stone-800">
                  Start the conversation
                </p>
              </div>
            </div>
          )}

        <div className="space-y-3">
          {messages.map(
            (message) => {
              const senderId =
                getEntityId(
                  message.sender,
                )

              const isOwnMessage =
                String(senderId) ===
                String(userId)

              const otherParticipantId =
                getEntityId(
                  otherParticipant,
                )

              const hasBeenRead =
                message.readBy?.some(
                  (reader) =>
                    String(
                      getEntityId(
                        reader,
                      ),
                    ) ===
                    String(
                      otherParticipantId,
                    ),
                )

              return (
                <article
                  key={getEntityId(
                    message,
                  )}
                  className={
                    'flex ' +
                    (isOwnMessage
                      ? 'justify-end'
                      : 'justify-start')
                  }
                >
                  <div
                    className={
                      'max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[70%] ' +
                      (isOwnMessage
                        ? 'rounded-br-md bg-emerald-950 text-white'
                        : 'rounded-bl-md border border-stone-200 bg-white text-stone-800')
                    }
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">
                      {message.content}
                    </p>

                    <div
                      className={
                        'mt-2 flex items-center justify-end gap-1 text-[10px] font-semibold ' +
                        (isOwnMessage
                          ? 'text-emerald-200'
                          : 'text-stone-400')
                      }
                    >
                      <time
                        dateTime={
                          message.createdAt
                        }
                        title={formatDateTime(
                          message.createdAt,
                        )}
                      >
                        {formatMessageTime(
                          message.createdAt,
                        )}
                      </time>

                      {isOwnMessage && (
                        <CheckCheck
                          size={13}
                          className={
                            hasBeenRead
                              ? 'text-sky-300'
                              : 'text-emerald-300/60'
                          }
                          aria-label={
                            hasBeenRead
                              ? 'Read'
                              : 'Sent'
                          }
                        />
                      )}
                    </div>
                  </div>
                </article>
              )
            },
          )}
        </div>

        <div
          ref={endOfMessagesRef}
        />
      </div>

      {isClosed ? (
        <div className="border-t border-stone-200 bg-white p-4">
          <p className="flex items-center justify-center gap-2 rounded-xl bg-stone-100 px-4 py-3 text-center text-sm font-bold text-stone-600">
            <Lock size={16} />
            This conversation is closed.
            {isAgent
              ? ' Reopen it to continue messaging.'
              : ' The agent can reopen it.'}
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSendMessage}
          className="border-t border-stone-200 bg-white p-3 sm:p-4"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-stone-300 bg-white p-2 focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-100">
            <textarea
              required
              minLength={3}
              maxLength={2000}
              rows={1}
              value={content}
              onChange={(event) =>
                setContent(
                  event.target.value,
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                    'Enter' &&
                  !event.shiftKey
                ) {
                  event.preventDefault()
                  event.currentTarget.form?.requestSubmit()
                }
              }}
              placeholder="Write a message..."
              aria-label="Message"
              className="max-h-32 min-h-11 flex-1 resize-y border-0 bg-transparent px-2 py-3 text-sm leading-5 outline-none"
            />

            <button
              type="submit"
              disabled={
                sendMessage.isPending ||
                content.trim().length < 3
              }
              className="focus-ring grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl bg-emerald-950 text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              {sendMessage.isPending ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>

          <p className="mt-2 px-2 text-[11px] font-semibold text-stone-400">
            Press Enter to send.
            Shift + Enter creates a
            new line.
          </p>
        </form>
      )}
    </section>
  )
}

function MessagesPage() {
  const { conversationId } =
    useParams()

  const navigate = useNavigate()
  const { user } = useAuth()

  const [status, setStatus] =
    useState('all')

  const [page, setPage] =
    useState(1)

  const userId = getEntityId(user)

  const inboxParams = useMemo(
    () => ({
      page,
      limit: 20,
      status:
        status === 'all'
          ? undefined
          : status,
    }),
    [page, status],
  )

  const inboxQuery =
    useChatInbox(inboxParams)

  useChatSocket(userId)

  const conversations =
    inboxQuery.data?.conversations ||
    []

  const selectedConversation =
    conversations.find(
      (conversation) =>
        String(
          getEntityId(
            conversation,
          ),
        ) ===
        String(conversationId),
    )

  const handleStatusChange = (
    nextStatus,
  ) => {
    setStatus(nextStatus)
    setPage(1)
    navigate('/messages')
  }

  const handlePageChange = (
    nextPage,
  ) => {
    setPage(nextPage)
    navigate('/messages')
  }

  return (
    <main className="page-shell py-7 sm:py-10">
      <div className="mb-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-700">
          Property conversations
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-stone-950">
          Messages
        </h1>

        <p className="mt-2 text-sm leading-6 text-stone-500">
          Keep property questions and
          agent responses together in
          one secure conversation.
        </p>
      </div>

      <div className="grid min-h-[42rem] overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm lg:grid-cols-[340px_minmax(0,1fr)]">
        <div
          className={
            conversationId
              ? 'hidden min-h-0 lg:block'
              : 'min-h-0'
          }
        >
          <ConversationList
            inboxQuery={inboxQuery}
            selectedConversationId={
              conversationId
            }
            userId={userId}
            status={status}
            onStatusChange={
              handleStatusChange
            }
            onPageChange={
              handlePageChange
            }
            onSelect={(
              selectedId,
            ) =>
              navigate(
                '/messages/' +
                  selectedId,
              )
            }
          />
        </div>

        {conversationId ? (
          <ConversationThread
            conversationId={
              conversationId
            }
            conversation={
              selectedConversation
            }
            user={user}
            onBack={() =>
              navigate('/messages')
            }
          />
        ) : (
          <section className="hidden min-h-0 items-center justify-center bg-stone-50 p-8 text-center lg:flex">
            <div className="max-w-sm">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-900">
                <MessageCircle
                  size={29}
                />
              </span>

              <h2 className="mt-5 text-xl font-black text-stone-900">
                Select a conversation
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Choose a property
                inquiry from your inbox
                to view its messages.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

export default MessagesPage