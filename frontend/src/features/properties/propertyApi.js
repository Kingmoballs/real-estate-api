import { keepPreviousData, useQuery } from '@tanstack/react-query'
import api from '../../lib/api.js'

export const compactPropertyParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  )

export const getPublicProperties = async (params = {}) => {
  const cleanParams = compactPropertyParams(params)
  const response = await api.get('/properties', { params: cleanParams })
  return response.data
}

export const getPublicProperty = async (propertyId) => {
  const response = await api.get('/properties/' + propertyId)
  return response.data.property
}

export const useProperties = (params = {}) => {
  const cleanParams = compactPropertyParams(params)

  return useQuery({
    queryKey: ['properties', 'public', cleanParams],
    queryFn: () => getPublicProperties(cleanParams),
    placeholderData: keepPreviousData,
  })
}

export const useProperty = (propertyId) =>
  useQuery({
    queryKey: ['properties', 'public', propertyId],
    queryFn: () => getPublicProperty(propertyId),
    enabled: Boolean(propertyId),
    retry: (failureCount, error) =>
      error.response?.status !== 404 && failureCount < 1,
  })
