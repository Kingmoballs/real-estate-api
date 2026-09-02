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

export const getAgentProperties = async (params = {}) => {
  const response = await api.get('/properties/mine', {
    params: compactParams(params),
  })
  return response.data
}

export const getAgentProperty = async (propertyId) => {
  const response = await api.get('/properties/mine/' + propertyId)
  return response.data.property
}

export const buildPropertyFormData = (values, files = []) => {
  const formData = new FormData()

  Object.entries(values).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return

    if (key === 'amenities') {
      formData.append(key, JSON.stringify(value))
      return
    }

    formData.append(key, String(value))
  })

  Array.from(files).forEach((file) => formData.append('images', file))
  return formData
}

export const createAgentProperty = async ({ values, files }) => {
  const response = await api.post(
    '/properties',
    buildPropertyFormData(values, files),
  )
  return response.data
}

export const updateAgentProperty = async ({
  propertyId,
  values,
  files,
}) => {
  const response = await api.patch(
    '/properties/' + propertyId,
    buildPropertyFormData(values, files),
  )
  return response.data
}

export const submitAgentProperty = async (propertyId) => {
  const response = await api.patch(
    '/properties/' + propertyId + '/submit-for-review',
  )
  return response.data
}

export const updateAgentPropertyStatus = async ({ propertyId, status }) => {
  const response = await api.patch('/properties/' + propertyId + '/status', {
    status,
  })
  return response.data
}

export const relistAgentProperty = async (propertyId) => {
  const response = await api.patch('/properties/' + propertyId + '/relist')
  return response.data
}

export const archiveAgentProperty = async (propertyId) => {
  const response = await api.delete('/properties/' + propertyId)
  return response.data
}

export const useAgentProperties = (params = {}) =>
  useQuery({
    queryKey: ['agent', 'properties', compactParams(params)],
    queryFn: () => getAgentProperties(params),
    placeholderData: keepPreviousData,
  })

export const useAgentProperty = (propertyId, enabled = true) =>
  useQuery({
    queryKey: ['agent', 'properties', 'detail', propertyId],
    queryFn: () => getAgentProperty(propertyId),
    enabled: Boolean(propertyId) && enabled,
  })

const useAgentPropertyMutation = (mutationFn) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'properties'] })
      queryClient.invalidateQueries({ queryKey: ['agent', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['properties', 'public'] })
    },
  })
}

export const useCreateAgentProperty = () =>
  useAgentPropertyMutation(createAgentProperty)

export const useUpdateAgentProperty = () =>
  useAgentPropertyMutation(updateAgentProperty)

export const useSubmitAgentProperty = () =>
  useAgentPropertyMutation(submitAgentProperty)

export const useUpdateAgentPropertyStatus = () =>
  useAgentPropertyMutation(updateAgentPropertyStatus)

export const useRelistAgentProperty = () =>
  useAgentPropertyMutation(relistAgentProperty)

export const useArchiveAgentProperty = () =>
  useAgentPropertyMutation(archiveAgentProperty)
