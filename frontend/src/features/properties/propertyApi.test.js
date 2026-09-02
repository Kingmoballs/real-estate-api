import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../lib/api.js'
import {
  getPublicProperties,
  getPublicProperty,
} from './propertyApi.js'

vi.mock('../../lib/api.js', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('property API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends only populated public catalogue filters', async () => {
    const payload = {
      properties: [],
      pagination: { currentPage: 1, totalItems: 0, totalPages: 0 },
    }
    api.get.mockResolvedValue({ data: payload })

    const result = await getPublicProperties({
      listingType: 'rent',
      search: '',
      minPrice: null,
      page: 1,
    })

    expect(api.get).toHaveBeenCalledWith('/properties', {
      params: { listingType: 'rent', page: 1 },
    })
    expect(result).toEqual(payload)
  })

  it('unwraps a public property detail response', async () => {
    const property = { _id: 'property-id', title: 'Published home' }
    api.get.mockResolvedValue({ data: { property } })

    await expect(getPublicProperty(property._id)).resolves.toEqual(property)
    expect(api.get).toHaveBeenCalledWith('/properties/property-id')
  })
})
