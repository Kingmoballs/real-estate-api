import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../lib/api.js'
import {
  archiveAgentProperty,
  buildPropertyFormData,
  createAgentProperty,
  getAgentProperties,
  relistAgentProperty,
  submitAgentProperty,
  updateAgentPropertyStatus,
} from './agentPropertyApi.js'

vi.mock('../../lib/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('agent property API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends only populated inventory filters', async () => {
    const payload = { properties: [], pagination: { currentPage: 1 } }
    api.get.mockResolvedValue({ data: payload })

    await expect(
      getAgentProperties({ status: '', listingType: 'rent', page: 1 }),
    ).resolves.toEqual(payload)

    expect(api.get).toHaveBeenCalledWith('/properties/mine', {
      params: { listingType: 'rent', page: 1 },
    })
  })

  it('serializes property values and images as multipart form data', () => {
    const image = new File(['image'], 'home.webp', { type: 'image/webp' })
    const formData = buildPropertyFormData(
      {
        title: 'Family home',
        price: 2500000,
        amenities: ['parking', 'security'],
        postalCode: '',
      },
      [image],
    )

    expect(formData.get('title')).toBe('Family home')
    expect(formData.get('price')).toBe('2500000')
    expect(formData.get('amenities')).toBe('["parking","security"]')
    expect(formData.has('postalCode')).toBe(false)
    expect(formData.get('images')).toBe(image)
  })

  it('creates a listing with the backend images field', async () => {
    const image = new File(['image'], 'home.jpg', { type: 'image/jpeg' })
    api.post.mockResolvedValue({ data: { message: 'created' } })

    await createAgentProperty({
      values: { title: 'Family home', submissionAction: 'draft' },
      files: [image],
    })

    const [path, formData] = api.post.mock.calls[0]
    expect(path).toBe('/properties')
    expect(formData.get('submissionAction')).toBe('draft')
    expect(formData.get('images')).toBe(image)
  })

  it('uses the supported listing workflow endpoints', async () => {
    api.patch.mockResolvedValue({ data: { message: 'updated' } })
    api.delete.mockResolvedValue({ data: { message: 'archived' } })

    await submitAgentProperty('property-id')
    await updateAgentPropertyStatus({
      propertyId: 'property-id',
      status: 'unavailable',
    })
    await relistAgentProperty('property-id')
    await archiveAgentProperty('property-id')

    expect(api.patch).toHaveBeenNthCalledWith(
      1,
      '/properties/property-id/submit-for-review',
    )
    expect(api.patch).toHaveBeenNthCalledWith(
      2,
      '/properties/property-id/status',
      { status: 'unavailable' },
    )
    expect(api.patch).toHaveBeenNthCalledWith(
      3,
      '/properties/property-id/relist',
    )
    expect(api.delete).toHaveBeenCalledWith('/properties/property-id')
  })
})
