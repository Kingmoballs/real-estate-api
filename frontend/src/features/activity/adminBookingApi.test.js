import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../lib/api.js'
import { getAdminBookings } from '../bookings/bookingApi.js'

vi.mock('../../lib/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('admin booking API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads platform bookings with payment filters', async () => {
    const payload = {
      bookings: [],
      pagination: {
        currentPage: 1,
        totalItems: 0,
        totalPages: 0,
      },
    }

    api.get.mockResolvedValue({ data: payload })

    const result = await getAdminBookings({
      paymentStatus: 'receiptUploaded',
      page: 1,
      limit: 8,
    })

    expect(api.get).toHaveBeenCalledWith('/bookings/admin', {
      params: {
        paymentStatus: 'receiptUploaded',
        page: 1,
        limit: 8,
      },
    })

    expect(result).toEqual(payload)
  })
})