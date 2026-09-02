import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import api from '../../lib/api.js'

export const notificationKeys = {
  all: ['notifications'],
  list: ['notifications', 'list'],
  unreadCount: ['notifications', 'unread-count'],
}

export const getNotifications = async () => {
  const response = await api.get('/notifications')
  return response.data
}

export const getUnreadNotificationCount = async () => {
  const response = await api.get(
    '/notifications/unread-count',
  )

  return response.data
}

export const markNotificationAsRead = async (
  notificationId,
) => {
  const response = await api.patch(
    '/notifications/' +
      notificationId +
      '/read',
  )

  return response.data
}

export const useNotifications = (
  enabled = true,
) =>
  useQuery({
    queryKey: notificationKeys.list,
    queryFn: getNotifications,
    enabled,
    refetchInterval: 60_000,
  })

export const useUnreadNotificationCount = (
  enabled = true,
) =>
  useQuery({
    queryKey:
      notificationKeys.unreadCount,
    queryFn:
      getUnreadNotificationCount,
    enabled,
    refetchInterval: 30_000,
  })

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn:
      markNotificationAsRead,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            notificationKeys.list,
        }),
        queryClient.invalidateQueries({
          queryKey:
            notificationKeys.unreadCount,
        }),
      ]),
  })
}