import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import api from '../../lib/api.js'

export const chatKeys = {
  all: ['chats'],
  inbox: ['chats', 'inbox'],
  conversation: (conversationId) => [
    'chats',
    'conversation',
    conversationId,
  ],
}

const compactParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== '',
    ),
  )

export const getChatInbox = async (
  params = {},
) => {
  const response = await api.get(
    '/chats/inbox',
    {
      params: compactParams(params),
    },
  )

  return response.data
}

export const getConversationMessages =
  async ({
    conversationId,
    page = 1,
    limit = 50,
  }) => {
    const response = await api.get(
      '/chats/' + conversationId,
      {
        params: { page, limit },
      },
    )

    return response.data
  }

export const sendChatMessage = async (
  payload,
) => {
  const response = await api.post(
    '/chats/send',
    payload,
  )

  return response.data
}

export const markConversationAsRead =
  async (conversationId) => {
    const response = await api.patch(
      '/chats/' +
        conversationId +
        '/read',
    )

    return response.data
  }

export const updateConversationStatus =
  async ({
    conversationId,
    status,
  }) => {
    const response = await api.patch(
      '/chats/' +
        conversationId +
        '/status',
      { status },
    )

    return response.data
  }

export const useChatInbox = (
  params = {},
) => {
  const cleanParams =
    compactParams(params)

  return useQuery({
    queryKey: [
      ...chatKeys.inbox,
      cleanParams,
    ],
    queryFn: () =>
      getChatInbox(cleanParams),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })
}

export const useConversationMessages = (
  conversationId,
) =>
  useInfiniteQuery({
    queryKey:
      chatKeys.conversation(
        conversationId,
      ),
    queryFn: ({ pageParam }) =>
      getConversationMessages({
        conversationId,
        page: pageParam,
        limit: 50,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination
        ?.hasNextPage
        ? lastPage.pagination
            .currentPage + 1
        : undefined,
    enabled: Boolean(conversationId),
    refetchInterval: 30_000,
  })

export const useSendChatMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (result) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: chatKeys.inbox,
        }),
        queryClient.invalidateQueries({
          queryKey:
            chatKeys.conversation(
              result.conversationId,
            ),
        }),
      ]),
  })
}

export const useMarkConversationAsRead =
  () => {
    const queryClient =
      useQueryClient()

    return useMutation({
      mutationFn:
        markConversationAsRead,
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: chatKeys.inbox,
        }),
    })
  }

export const useUpdateConversationStatus =
  () => {
    const queryClient =
      useQueryClient()

    return useMutation({
      mutationFn:
        updateConversationStatus,
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: chatKeys.all,
        }),
    })
  }