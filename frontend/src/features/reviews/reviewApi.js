import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import api from '../../lib/api.js'

const compactReviewParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== '',
    ),
  )

export const getPublicPropertyReviews = async (
  propertyId,
  params = {},
) => {
  const response = await api.get(
    '/reviews/property/' + propertyId,
    {
      params: compactReviewParams(params),
    },
  )

  return response.data
}

export const getReviewEligibility = async (propertyId) => {
  const response = await api.get(
    '/reviews/eligibility/' + propertyId,
  )

  return response.data
}

export const createReview = async (review) => {
  const response = await api.post('/reviews', review)
  return response.data
}

export const getMyReviews = async (params = {}) => {
  const response = await api.get('/reviews/mine', {
    params: compactReviewParams(params),
  })

  return response.data
}

export const updateReview = async ({
  reviewId,
  payload,
}) => {
  const response = await api.patch(
    '/reviews/' + reviewId,
    payload,
  )

  return response.data
}

export const deleteReview = async (reviewId) => {
  const response = await api.delete(
    '/reviews/' + reviewId,
  )

  return response.data
}

export const getAgentReviews = async (params = {}) => {
  const response = await api.get('/reviews/agent', {
    params: compactReviewParams(params),
  })

  return response.data
}

export const saveAgentReviewResponse = async ({
  reviewId,
  comment,
}) => {
  const response = await api.put(
    '/reviews/' + reviewId + '/response',
    { comment },
  )

  return response.data
}

export const deleteAgentReviewResponse = async (
  reviewId,
) => {
  const response = await api.delete(
    '/reviews/' + reviewId + '/response',
  )

  return response.data
}

export const getAdminReviews = async (
  params = {},
) => {
  const response = await api.get(
    '/reviews/admin',
    {
      params:
        compactReviewParams(params),
    },
  )

  return response.data
}

export const moderateReview = async ({
  reviewId,
  status,
  reason,
}) => {
  const payload =
    status === 'hidden'
      ? {
          status,
          reason: reason.trim(),
        }
      : { status }

  const response = await api.patch(
    '/reviews/' +
      reviewId +
      '/moderate',
    payload,
  )

  return response.data
}

export const usePropertyReviews = (
  propertyId,
  params = {},
) => {
  const cleanParams = compactReviewParams(params)

  return useQuery({
    queryKey: [
      'reviews',
      'property',
      propertyId,
      cleanParams,
    ],
    queryFn: () =>
      getPublicPropertyReviews(propertyId, cleanParams),
    enabled: Boolean(propertyId),
    placeholderData: keepPreviousData,
  })
}

export const useReviewEligibility = (
  propertyId,
  enabled = true,
) =>
  useQuery({
    queryKey: [
      'reviews',
      'eligibility',
      propertyId,
    ],
    queryFn: () => getReviewEligibility(propertyId),
    enabled: Boolean(propertyId) && enabled,
    retry: false,
  })

export const useCreateReview = (propertyId) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createReview,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            'reviews',
            'property',
            propertyId,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            'reviews',
            'eligibility',
            propertyId,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            'properties',
            'public',
            propertyId,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: ['properties', 'public'],
        }),
      ]),
  })
}

export const useMyReviews = (params = {}) => {
  const cleanParams =
    compactReviewParams(params)

  return useQuery({
    queryKey: [
      'reviews',
      'mine',
      cleanParams,
    ],
    queryFn: () =>
      getMyReviews(cleanParams),
    placeholderData: keepPreviousData,
  })
}

const useReviewManagementMutation = (
  mutationFn,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['reviews'],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            'properties',
            'public',
          ],
        }),
      ]),
  })
}

export const useUpdateReview = () =>
  useReviewManagementMutation(updateReview)

export const useDeleteReview = () =>
  useReviewManagementMutation(deleteReview)

export const useAgentReviews = (params = {}) => {
  const cleanParams =
    compactReviewParams(params)

  return useQuery({
    queryKey: [
      'reviews',
      'agent',
      cleanParams,
    ],
    queryFn: () =>
      getAgentReviews(cleanParams),
    placeholderData: keepPreviousData,
  })
}

export const useSaveAgentReviewResponse = () =>
  useReviewManagementMutation(
    saveAgentReviewResponse,
  )

export const useDeleteAgentReviewResponse = () =>
  useReviewManagementMutation(
    deleteAgentReviewResponse,
  )

export const useAdminReviews = (
  params = {},
) => {
  const cleanParams =
    compactReviewParams(params)

  return useQuery({
    queryKey: [
      'reviews',
      'admin',
      cleanParams,
    ],
    queryFn: () =>
      getAdminReviews(cleanParams),
    placeholderData: keepPreviousData,
  })
}

export const useModerateReview = () =>
  useReviewManagementMutation(
    moderateReview,
  )