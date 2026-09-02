import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../lib/api.js'
import { getAdminInspections } from '../inspections/inspectionApi.js'

vi.mock('../../lib/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('admin inspection API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads platform inspections with filters', async () => {
    const payload = {
      inspections: [],
      pagination: {
        currentPage: 1,
        totalItems: 0,
        totalPages: 0,
      },
    }

    api.get.mockResolvedValue({ data: payload })

    const result = await getAdminInspections({
      status: 'pending',
      page: 1,
      limit: 8,
    })

    expect(api.get).toHaveBeenCalledWith('/inspections/admin', {
      params: {
        status: 'pending',
        page: 1,
        limit: 8,
      },
    })

    expect(result).toEqual(payload)
  })
})