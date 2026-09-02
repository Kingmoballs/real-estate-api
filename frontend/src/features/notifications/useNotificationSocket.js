import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getNotificationSocket } from '../../lib/socket.js'
import { notificationKeys } from './notificationApi.js'

const notificationTitles = {
  booking: 'Booking update',
  inspection: 'Inspection update',
  review: 'Review update',
  message: 'New message',
  property: 'Property update',
  system: 'System notification',
}

const normalizeNotification = (payload) => {
  const notificationId =
    payload?._id || payload?.id

  if (!notificationId) {
    return null
  }

  const type = payload.type || 'system'

  return {
    ...payload,
    _id: notificationId,
    id: notificationId,
    type,
    title:
      payload.title ||
      notificationTitles[type] ||
      'New notification',
    body:
      payload.body ||
      payload.message ||
      '',
    isRead: false,
    createdAt:
      payload.createdAt ||
      new Date().toISOString(),
  }
}

const relatedQueryKeys = {
  booking: ['bookings'],
  inspection: ['inspections'],
  review: ['reviews'],
  property: ['properties'],
}

function useNotificationSocket(userId) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) {
      return undefined
    }

    const socket = getNotificationSocket()

    const handleNotification = (
      payload,
    ) => {
      const notification =
        normalizeNotification(payload)

      if (!notification) {
        return
      }

      let wasAdded = false

      queryClient.setQueryData(
        notificationKeys.list,
        (currentNotifications) => {
          const notifications =
            Array.isArray(
              currentNotifications,
            )
              ? currentNotifications
              : []

          const alreadyExists =
            notifications.some(
              (currentNotification) =>
                String(
                  currentNotification._id ||
                    currentNotification.id,
                ) ===
                String(notification._id),
            )

          if (alreadyExists) {
            return notifications
          }

          wasAdded = true

          return [
            notification,
            ...notifications,
          ]
        },
      )

      if (!wasAdded) {
        return
      }

      queryClient.setQueryData(
        notificationKeys.unreadCount,
        (currentCount) => ({
          unread:
            Number(
              currentCount?.unread || 0,
            ) + 1,
        }),
      )

      toast.info(notification.title, {
        description:
          notification.body ||
          undefined,
      })

      const relatedQueryKey =
        relatedQueryKeys[
          notification.type
        ]

      if (relatedQueryKey) {
        void queryClient.invalidateQueries({
          queryKey: relatedQueryKey,
        })
      }

      // Reconcile the local update with the database.
      void queryClient.invalidateQueries({
        queryKey:
          notificationKeys.all,
      })
    }

    const handleConnectionError = (
      error,
    ) => {
      if (import.meta.env.DEV) {
        console.warn(
          'Notification socket connection failed:',
          error.message,
        )
      }
    }

    socket.on(
      'notification',
      handleNotification,
    )

    socket.on(
      'connect_error',
      handleConnectionError,
    )

    if (!socket.connected) {
      socket.connect()
    }

    return () => {
      socket.off(
        'notification',
        handleNotification,
      )

      socket.off(
        'connect_error',
        handleConnectionError,
      )

      socket.disconnect()
    }
  }, [queryClient, userId])
}

export default useNotificationSocket