import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getNotificationSocket } from '../../lib/socket.js'
import { chatKeys } from './chatApi.js'

function useChatSocket(userId) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) {
      return undefined
    }

    const socket =
      getNotificationSocket()

    const handleNotification = (
      notification,
    ) => {
      if (
        notification?.type !==
        'message'
      ) {
        return
      }

      const conversationId =
        notification.conversation?._id ||
        notification.conversation ||
        notification.conversationId

      void queryClient.invalidateQueries({
        queryKey: chatKeys.inbox,
      })

      if (conversationId) {
        void queryClient.invalidateQueries({
          queryKey:
            chatKeys.conversation(
              conversationId,
            ),
        })
      }
    }

    socket.on(
      'notification',
      handleNotification,
    )

    if (!socket.connected) {
      socket.connect()
    }

    return () => {
      socket.off(
        'notification',
        handleNotification,
      )

      /*
       * Do not disconnect here. The header
       * notification centre shares this socket.
       */
    }
  }, [queryClient, userId])
}

export default useChatSocket