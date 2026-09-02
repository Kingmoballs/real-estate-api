import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import api from '../../lib/api.js'
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
} from './notificationApi.js'

vi.mock('../../lib/api.js', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('notification API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the authenticated user notifications', async () => {
    const notifications = [
      {
        _id: 'notification-1',
        type: 'booking',
        title: 'New booking',
        isRead: false,
      },
    ]

    api.get.mockResolvedValue({
      data: notifications,
    })

    const result =
      await getNotifications()

    expect(api.get).toHaveBeenCalledWith(
      '/notifications',
    )

    expect(result).toEqual(
      notifications,
    )
  })

  it('loads the unread notification count', async () => {
    api.get.mockResolvedValue({
      data: { unread: 3 },
    })

    const result =
      await getUnreadNotificationCount()

    expect(api.get).toHaveBeenCalledWith(
      '/notifications/unread-count',
    )

    expect(result).toEqual({
      unread: 3,
    })
  })

  it('marks one notification as read', async () => {
    const updatedNotification = {
      _id: 'notification-1',
      isRead: true,
    }

    api.patch.mockResolvedValue({
      data: updatedNotification,
    })

    const result =
      await markNotificationAsRead(
        'notification-1',
      )

    expect(
      api.patch,
    ).toHaveBeenCalledWith(
      '/notifications/notification-1/read',
    )

    expect(result).toEqual(
      updatedNotification,
    )
  })
})