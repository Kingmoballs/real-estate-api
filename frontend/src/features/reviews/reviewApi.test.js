import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import api from '../../lib/api.js'
import {
  createReview,
  deleteReview,
  getMyReviews,
  getPublicPropertyReviews,
  getReviewEligibility,
  updateReview,
  deleteAgentReviewResponse,
  getAgentReviews,
  saveAgentReviewResponse,
  getAdminReviews,
  moderateReview,
} from './reviewApi.js'

vi.mock('../../lib/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('review API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads public reviews with populated filters only', async () => {
    const payload = {
      reviews: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
      },
    }

    api.get.mockResolvedValue({
      data: payload,
    })

    const result =
      await getPublicPropertyReviews(
        'property-id',
        {
          page: 1,
          sort: 'newest',
          rating: '',
        },
      )

    expect(api.get).toHaveBeenCalledWith(
      '/reviews/property/property-id',
      {
        params: {
          page: 1,
          sort: 'newest',
        },
      },
    )

    expect(result).toEqual(payload)
  })

  it('checks whether a customer can review a property', async () => {
    const eligibility = {
      eligible: true,
      verificationSource: 'inspection',
    }

    api.get.mockResolvedValue({
      data: eligibility,
    })

    await expect(
      getReviewEligibility('property-id'),
    ).resolves.toEqual(eligibility)

    expect(api.get).toHaveBeenCalledWith(
      '/reviews/eligibility/property-id',
    )
  })

  it('submits a verified review', async () => {
    const review = {
      property: 'property-id',
      rating: 5,
      title: 'Excellent property',
      comment:
        'The property was exactly as described.',
    }

    api.post.mockResolvedValue({
      data: {
        message:
          'Review created successfully',
        review,
      },
    })

    await createReview(review)

    expect(api.post).toHaveBeenCalledWith(
      '/reviews',
      review,
    )
  })

  it('loads the authenticated customer reviews', async () => {
    const payload = {
      reviews: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
      },
    }

    api.get.mockResolvedValue({
      data: payload,
    })

    await expect(
      getMyReviews({
        page: 1,
        status: '',
      }),
    ).resolves.toEqual(payload)

    expect(api.get).toHaveBeenCalledWith(
      '/reviews/mine',
      {
        params: {
          page: 1,
        },
      },
    )
  })

  it('updates a customer review', async () => {
    const payload = {
      rating: 4,
      title: 'Updated review',
      comment:
        'This is my updated property review.',
    }

    api.patch.mockResolvedValue({
      data: {
        message:
          'Review updated successfully',
      },
    })

    await updateReview({
      reviewId: 'review-id',
      payload,
    })

    expect(api.patch).toHaveBeenCalledWith(
      '/reviews/review-id',
      payload,
    )
  })

  it('deletes a customer review', async () => {
    api.delete.mockResolvedValue({
      data: {
        deleted: true,
      },
    })

    await deleteReview('review-id')

    expect(api.delete).toHaveBeenCalledWith(
      '/reviews/review-id',
    )
  })

  it('loads reviews for the authenticated agent', async () => {
    const payload = {
      reviews: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
      },
    }

    api.get.mockResolvedValue({
      data: payload,
    })

    await expect(
      getAgentReviews({
        page: 1,
        status: 'published',
        rating: '',
      }),
    ).resolves.toEqual(payload)

    expect(api.get).toHaveBeenCalledWith(
      '/reviews/agent',
      {
        params: {
          page: 1,
          status: 'published',
        },
      },
    )
  })

  it('creates or updates an agent response', async () => {
    api.put.mockResolvedValue({
      data: {
        message:
          'Response saved successfully',
      },
    })

    await saveAgentReviewResponse({
      reviewId: 'review-id',
      comment:
        'Thank you for your feedback.',
    })

    expect(api.put).toHaveBeenCalledWith(
      '/reviews/review-id/response',
      {
        comment:
          'Thank you for your feedback.',
      },
    )
  })

  it('removes an agent response', async () => {
    api.delete.mockResolvedValue({
      data: {
        message:
          'Response removed successfully',
      },
    })

    await deleteAgentReviewResponse(
      'review-id',
    )

    expect(api.delete).toHaveBeenCalledWith(
      '/reviews/review-id/response',
    )
  })

  it('loads reviews for administrators', async () => {
    const payload = {
      reviews: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
      },
    }

    api.get.mockResolvedValue({
      data: payload,
    })

    await expect(
      getAdminReviews({
        page: 1,
        status: 'hidden',
        rating: '',
      }),
    ).resolves.toEqual(payload)

    expect(api.get).toHaveBeenCalledWith(
      '/reviews/admin',
      {
        params: {
          page: 1,
          status: 'hidden',
        },
      },
    )
  })

  it('hides a review with a moderation reason', async () => {
    api.patch.mockResolvedValue({
      data: {
        message:
          'Review moderation updated',
      },
    })

    await moderateReview({
      reviewId: 'review-id',
      status: 'hidden',
      reason: 'Contains inappropriate content',
    })

    expect(api.patch).toHaveBeenCalledWith(
      '/reviews/review-id/moderate',
      {
        status: 'hidden',
        reason:
          'Contains inappropriate content',
      },
    )
  })

  it('republishes without sending a reason', async () => {
    api.patch.mockResolvedValue({
      data: {
        message:
          'Review moderation updated',
      },
    })

    await moderateReview({
      reviewId: 'review-id',
      status: 'published',
    })

    expect(api.patch).toHaveBeenCalledWith(
      '/reviews/review-id/moderate',
      {
        status: 'published',
      },
    )
  })
})