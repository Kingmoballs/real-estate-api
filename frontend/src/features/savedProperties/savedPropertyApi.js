import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api.js'

export const getSavedStatus = async (propertyId) => {
  const response = await api.get('/saved-properties/' + propertyId + '/status')
  return response.data
}

export const getSavedProperties = async (params = {}) => {
  const response = await api.get('/saved-properties', { params })
  return response.data
}

export const setPropertySaved = async ({ propertyId, shouldSave }) => {
  const response = shouldSave
    ? await api.put('/saved-properties/' + propertyId)
    : await api.delete('/saved-properties/' + propertyId)

  return response.data
}

export const useSavedStatus = (propertyId, enabled = true) =>
  useQuery({
    queryKey: ['saved-properties', 'status', propertyId],
    queryFn: () => getSavedStatus(propertyId),
    enabled: Boolean(propertyId) && enabled,
  })

export const useSavedProperties = (params = {}) =>
  useQuery({
    queryKey: ['saved-properties', 'list', params],
    queryFn: () => getSavedProperties(params),
    placeholderData: keepPreviousData,
  })

export const useSetPropertySaved = (propertyId) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (shouldSave) =>
      setPropertySaved({ propertyId, shouldSave }),
    onSuccess: (_data, shouldSave) => {
      queryClient.setQueryData(
        ['saved-properties', 'status', propertyId],
        { propertyId, isSaved: shouldSave },
      )
      queryClient.invalidateQueries({
        queryKey: ['saved-properties', 'list'],
      })
    },
  })
}
