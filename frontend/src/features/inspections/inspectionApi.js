import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api.js'

export const getMyInspections = async (params = {}) => {
  const response = await api.get('/inspections/mine', { params })
  return response.data
}

export const getAgentInspections = async (params = {}) => {
  const response = await api.get('/inspections/agent', { params })
  return response.data
}

export const getAdminInspections = async (params = {}) => {
  const response = await api.get('/inspections/admin', { params })
  return response.data
}

export const createInspection = async (payload) => {
  const response = await api.post('/inspections', payload)
  return response.data
}

export const cancelInspection = async ({ inspectionId, reason }) => {
  const response = await api.patch(
    '/inspections/' + inspectionId + '/cancel',
    { reason },
  )
  return response.data
}

export const acceptInspectionReschedule = async (inspectionId) => {
  const response = await api.patch(
    '/inspections/' + inspectionId + '/accept-reschedule',
  )
  return response.data
}

export const confirmInspection = async (inspectionId) => {
  const response = await api.patch(
    '/inspections/' + inspectionId + '/confirm',
  )
  return response.data
}

export const rescheduleInspection = async ({
  inspectionId,
  proposedFor,
  message,
}) => {
  const response = await api.patch(
    '/inspections/' + inspectionId + '/reschedule',
    { proposedFor, message },
  )
  return response.data
}

export const rejectInspection = async ({ inspectionId, reason }) => {
  const response = await api.patch(
    '/inspections/' + inspectionId + '/reject',
    { reason },
  )
  return response.data
}

export const completeInspection = async (inspectionId) => {
  const response = await api.patch(
    '/inspections/' + inspectionId + '/complete',
  )
  return response.data
}

export const useMyInspections = (params = {}) =>
  useQuery({
    queryKey: ['inspections', 'mine', params],
    queryFn: () => getMyInspections(params),
    placeholderData: keepPreviousData,
  })

export const useAgentInspections = (params = {}) =>
  useQuery({
    queryKey: ['inspections', 'agent', params],
    queryFn: () => getAgentInspections(params),
    placeholderData: keepPreviousData,
  })

export const useAdminInspections = (params = {}) =>
  useQuery({
    queryKey: ['inspections', 'admin', params],
    queryFn: () => getAdminInspections(params),
    placeholderData: keepPreviousData,
  })

const useInspectionMutation = (mutationFn) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['inspections'] }),
  })
}

export const useCreateInspection = () =>
  useInspectionMutation(createInspection)

export const useCancelInspection = () =>
  useInspectionMutation(cancelInspection)

export const useAcceptInspectionReschedule = () =>
  useInspectionMutation(acceptInspectionReschedule)

export const useConfirmInspection = () =>
  useInspectionMutation(confirmInspection)

export const useRescheduleInspection = () =>
  useInspectionMutation(rescheduleInspection)

export const useRejectInspection = () =>
  useInspectionMutation(rejectInspection)

export const useCompleteInspection = () =>
  useInspectionMutation(completeInspection)
