import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import api from '../../lib/api.js'
import {
  getChatInbox,
  getConversationMessages,
  markConversationAsRead,
  sendChatMessage,
  updateConversationStatus,
} from './chatApi.js'

vi.mock('../../lib/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('chat API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the user inbox', async () => {
    const payload = {
      conversations: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
      },
    }

    api.get.mockResolvedValue({
      data: payload,
    })

    const result =
      await getChatInbox({
        status: 'open',
        page: 1,
        limit: 20,
      })

    expect(api.get).toHaveBeenCalledWith(
      '/chats/inbox',
      {
        params: {
          status: 'open',
          page: 1,
          limit: 20,
        },
      },
    )

    expect(result).toEqual(payload)
  })

  it('loads conversation messages', async () => {
    const payload = {
      messages: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
      },
    }

    api.get.mockResolvedValue({
      data: payload,
    })

    const result =
      await getConversationMessages({
        conversationId:
          'conversation-1',
        page: 1,
        limit: 50,
      })

    expect(api.get).toHaveBeenCalledWith(
      '/chats/conversation-1',
      {
        params: {
          page: 1,
          limit: 50,
        },
      },
    )

    expect(result).toEqual(payload)
  })

  it('starts a property conversation', async () => {
    const payload = {
      conversationId:
        'conversation-1',
      data: {
        _id: 'message-1',
      },
    }

    api.post.mockResolvedValue({
      data: payload,
    })

    const message = {
      propertyId: 'property-1',
      inquiryType: 'availability',
      content:
        'Is this still available?',
    }

    const result =
      await sendChatMessage(message)

    expect(api.post).toHaveBeenCalledWith(
      '/chats/send',
      message,
    )

    expect(result).toEqual(payload)
  })

  it('continues an existing conversation', async () => {
    api.post.mockResolvedValue({
      data: {
        conversationId:
          'conversation-1',
      },
    })

    await sendChatMessage({
      conversationId:
        'conversation-1',
      content:
        'Thank you for responding.',
    })

    expect(api.post).toHaveBeenCalledWith(
      '/chats/send',
      {
        conversationId:
          'conversation-1',
        content:
          'Thank you for responding.',
      },
    )
  })

  it('marks a conversation as read', async () => {
    api.patch.mockResolvedValue({
      data: {
        message:
          'Conversation marked as read',
      },
    })

    await markConversationAsRead(
      'conversation-1',
    )

    expect(
      api.patch,
    ).toHaveBeenCalledWith(
      '/chats/conversation-1/read',
    )
  })

  it('updates a conversation status', async () => {
    api.patch.mockResolvedValue({
      data: {
        conversation: {
          status: 'closed',
        },
      },
    })

    await updateConversationStatus({
      conversationId:
        'conversation-1',
      status: 'closed',
    })

    expect(
      api.patch,
    ).toHaveBeenCalledWith(
      '/chats/conversation-1/status',
      {
        status: 'closed',
      },
    )
  })
})