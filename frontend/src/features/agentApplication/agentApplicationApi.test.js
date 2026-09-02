import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import api from '../../lib/api.js'
import {
  getMyAgentApplication,
  submitAgentApplication,
} from './agentApplicationApi.js'

vi.mock('../../lib/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('agent application API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the current application', async () => {
    const application = {
      _id: 'application-1',
      status: 'pending',
    }

    api.get.mockResolvedValue({
      data: { application },
    })

    const result =
      await getMyAgentApplication()

    expect(api.get).toHaveBeenCalledWith(
      '/agent-applications/me',
    )

    expect(result).toEqual(
      application,
    )
  })

  it('returns null when the user has not applied', async () => {
    api.get.mockRejectedValue({
      response: {
        status: 404,
      },
    })

    const result =
      await getMyAgentApplication()

    expect(result).toBeNull()
  })

  it('submits an application', async () => {
    const application = {
      businessType: 'individual',
      businessName:
        'Haven Realty',
      registrationNumber: null,
      yearsOfExperience: 5,
      serviceAreas: ['Lekki'],
      officeAddress:
        '10 Example Street, Lagos',
      bio: 'I help customers find verified residential properties across Lagos.',
    }

    api.post.mockResolvedValue({
      data: {
        message:
          'Agent application submitted successfully',
        application: {
          ...application,
          status: 'pending',
        },
      },
    })

    const result =
      await submitAgentApplication(
        application,
      )

    expect(api.post).toHaveBeenCalledWith(
      '/agent-applications',
      application,
    )

    expect(
      result.application.status,
    ).toBe('pending')
  })
})