import {
  Bell,
  Building2,
  CalendarCheck2,
  CalendarRange,
  MessageCircle,
  MessageSquareText,
  ShieldCheck,
} from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import useAuth from '../../features/auth/useAuth.js'
import {
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationCount,
} from '../../features/notifications/notificationApi.js'
import useNotificationSocket from '../../features/notifications/useNotificationSocket.js'
import { getApiErrorMessage } from '../../lib/errors.js'

const notificationIcons = {
  booking: CalendarRange,
  inspection: CalendarCheck2,
  review: MessageSquareText,
  message: MessageCircle,
  property: Building2,
  system: ShieldCheck,
}

const dateFormatter =
  new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

const getNotificationId = (
  notification,
) =>
  notification._id || notification.id

const getPropertyId = (
  notification,
) =>
  notification.property?._id ||
  notification.property ||
  notification.propertyId

const getDashboardPath = (role) => {
  if (role === 'admin') {
    return '/admin'
  }

  if (role === 'agent') {
    return '/agent'
  }

  return '/account'
}

const getNotificationTarget = (
  notification,
  role,
) => {
  switch (notification.type) {
    case 'booking':
      if (role === 'admin') {
        return '/admin/bookings'
      }

      if (role === 'agent') {
        return '/agent/bookings'
      }

      return '/bookings'

    case 'inspection':
      if (role === 'admin') {
        return '/admin/inspections'
      }

      if (role === 'agent') {
        return '/agent/inspections'
      }

      return '/account?tab=inspections'

    case 'review':
      if (role === 'admin') {
        return '/admin/reviews'
      }

      if (role === 'agent') {
        return '/agent/reviews'
      }

      return '/account?tab=reviews'

    case 'property': {
      const propertyId =
        getPropertyId(notification)

      if (propertyId) {
        return (
          '/properties/' +
          propertyId
        )
      }

      if (role === 'admin') {
        return '/admin/properties'
      }

      if (role === 'agent') {
        return '/agent/properties'
      }

      return '/properties'
    }

    case 'system':
      return getDashboardPath(role)

    case 'message': {
      const conversationId =
        notification.conversation?._id ||
        notification.conversation ||
        notification.conversationId

      return conversationId
        ? '/messages/' +
            conversationId
        : '/messages'
    }

    default:
      return null
  }
}

const formatNotificationTime = (
  createdAt,
) => {
  const date = new Date(createdAt)

  if (
    Number.isNaN(date.getTime())
  ) {
    return 'Just now'
  }

  return dateFormatter.format(date)
}

function NotificationIcon({ type }) {
  const Icon =
    notificationIcons[type] || Bell

  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-900">
      <Icon size={18} />
    </span>
  )
}

function NotificationCenter() {
  const [isOpen, setIsOpen] =
    useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  const notificationsQuery =
    useNotifications(Boolean(user))

  const unreadCountQuery =
    useUnreadNotificationCount(
      Boolean(user),
    )

  const markNotification =
    useMarkNotificationAsRead()

  useNotificationSocket(user?._id)

  const notifications =
    Array.isArray(
      notificationsQuery.data,
    )
      ? notificationsQuery.data
      : []

  const visibleNotifications =
    notifications.slice(0, 8)

  const unreadCount = Number(
    unreadCountQuery.data?.unread ||
      0,
  )

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handlePointerDown = (
      event,
    ) => {
      if (
        !containerRef.current?.contains(
          event.target,
        )
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener(
      'pointerdown',
      handlePointerDown,
    )

    document.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown,
      )

      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [isOpen])

  if (!user) {
    return null
  }

  const handleNotificationSelect = (
    notification,
  ) => {
    const notificationId =
      getNotificationId(notification)

    if (
      !notification.isRead &&
      notificationId
    ) {
      markNotification.mutate(
        notificationId,
        {
          onError: (error) => {
            toast.error(
              getApiErrorMessage(
                error,
                'The notification could not be marked as read.',
              ),
            )
          },
        },
      )
    }

    const target =
      getNotificationTarget(
        notification,
        user.role,
      )

    setIsOpen(false)

    if (target) {
      navigate(target)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        type="button"
        className="focus-ring relative grid size-10 cursor-pointer place-items-center rounded-full border border-stone-300 bg-white text-stone-700 transition hover:border-emerald-800 hover:text-emerald-900"
        onClick={() =>
          setIsOpen(
            (current) => !current,
          )
        }
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
        aria-controls="notification-panel"
      >
        <Bell size={19} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white ring-2 ring-[#f7f5ef]">
            {unreadCount > 99
              ? '99+'
              : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          id="notification-panel"
          className="absolute right-0 top-12 z-[70] w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-950/15"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
            <div>
              <h2 className="font-black text-stone-950">
                Notifications
              </h2>
              <p className="mt-0.5 text-xs font-medium text-stone-500">
                {unreadCount === 1
                  ? '1 unread notification'
                  : `${unreadCount} unread notifications`}
              </p>
            </div>

            <Bell
              size={19}
              className="text-emerald-900"
            />
          </div>

          <div className="max-h-[min(32rem,70vh)] overflow-y-auto">
            {notificationsQuery.isLoading && (
              <div className="px-5 py-10 text-center text-sm font-semibold text-stone-500">
                Loading notifications...
              </div>
            )}

            {notificationsQuery.isError && (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-bold text-red-700">
                  Notifications could
                  not be loaded.
                </p>

                <button
                  type="button"
                  className="focus-ring mt-3 cursor-pointer text-sm font-bold text-emerald-800"
                  onClick={() =>
                    notificationsQuery.refetch()
                  }
                >
                  Try again
                </button>
              </div>
            )}

            {!notificationsQuery.isLoading &&
              !notificationsQuery.isError &&
              visibleNotifications.length ===
                0 && (
                <div className="px-6 py-12 text-center">
                  <span className="mx-auto grid size-12 place-items-center rounded-full bg-stone-100 text-stone-500">
                    <Bell size={21} />
                  </span>

                  <p className="mt-4 font-bold text-stone-800">
                    No notifications yet
                  </p>

                  <p className="mt-1 text-sm text-stone-500">
                    New activity will
                    appear here.
                  </p>
                </div>
              )}

            {visibleNotifications.map(
              (notification) => {
                const notificationId =
                  getNotificationId(
                    notification,
                  )

                return (
                  <button
                    key={notificationId}
                    type="button"
                    onClick={() =>
                      handleNotificationSelect(
                        notification,
                      )
                    }
                    className={`focus-ring flex w-full cursor-pointer gap-3 border-b border-stone-100 px-5 py-4 text-left transition last:border-b-0 ${
                      notification.isRead
                        ? 'bg-white hover:bg-stone-50'
                        : 'bg-emerald-50/70 hover:bg-emerald-50'
                    }`}
                  >
                    <NotificationIcon
                      type={
                        notification.type
                      }
                    />

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-extrabold text-stone-900">
                          {notification.title ||
                            'New notification'}
                        </span>

                        {!notification.isRead && (
                          <span
                            className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-600"
                            aria-label="Unread"
                          />
                        )}
                      </span>

                      {notification.body && (
                        <span className="mt-1 block text-sm leading-5 text-stone-600">
                          {
                            notification.body
                          }
                        </span>
                      )}

                      <span className="mt-2 block text-xs font-semibold text-stone-400">
                        {formatNotificationTime(
                          notification.createdAt,
                        )}
                      </span>
                    </span>
                  </button>
                )
              },
            )}
          </div>

          {notifications.length > 8 && (
            <div className="border-t border-stone-200 bg-stone-50 px-5 py-3 text-center text-xs font-bold text-stone-500">
              Showing the 8 most recent
              notifications
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default NotificationCenter