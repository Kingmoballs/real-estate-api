import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import api from '../../lib/api.js'

const compactParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== '' && value !== null && value !== undefined,
    ),
  )

export const getAdminProperties = async (params = {}) => {
  const response = await api.get('/properties/admin', {
    params: compactParams(params),
  })

  return response.data
}

export const getAdminProperty = async (propertyId) => {
  const response = await api.get('/properties/admin/' + propertyId)

  return response.data.property
}

export const approveAdminProperty = async (propertyId) => {
  const response = await api.patch(
    '/properties/admin/' + propertyId + '/approve',
  )

  return response.data
}

export const rejectAdminProperty = async ({
  propertyId,
  reason,
}) => {
  const response = await api.patch(
    '/properties/admin/' + propertyId + '/reject',
    { reason },
  )

  return response.data
}

export const useAdminProperties = (params = {}) =>
  useQuery({
    queryKey: ['admin', 'properties', compactParams(params)],
    queryFn: () => getAdminProperties(params),
    placeholderData: keepPreviousData,
  })

export const useAdminProperty = (propertyId) =>
  useQuery({
    queryKey: ['admin', 'properties', 'detail', propertyId],
    queryFn: () => getAdminProperty(propertyId),
    enabled: Boolean(propertyId),
  })

const useAdminPropertyMutation = (mutationFn) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'properties'],
      })

      queryClient.invalidateQueries({
        queryKey: ['properties', 'public'],
      })
    },
  })
}

export const useApproveAdminProperty = () =>
  useAdminPropertyMutation(approveAdminProperty)

export const useRejectAdminProperty = () =>
  useAdminPropertyMutation(rejectAdminProperty)