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

export const getAdminAgentApplications = async (params = {}) => {
  const response = await api.get('/agent-applications/admin', {
    params: compactParams(params),
  })

  return response.data
}

export const approveAgentApplication = async (applicationId) => {
  const response = await api.patch(
    '/agent-applications/admin/' + applicationId + '/approve',
  )

  return response.data
}

export const rejectAgentApplication = async ({
  applicationId,
  reason,
}) => {
  const response = await api.patch(
    '/agent-applications/admin/' + applicationId + '/reject',
    { reason },
  )

  return response.data
}

export const useAdminAgentApplications = (params = {}) =>
  useQuery({
    queryKey: ['admin', 'agent-applications', compactParams(params)],
    queryFn: () => getAdminAgentApplications(params),
    placeholderData: keepPreviousData,
  })

const useAgentApplicationMutation = (mutationFn) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'agent-applications'],
      })
    },
  })
}

export const useApproveAgentApplication = () =>
  useAgentApplicationMutation(approveAgentApplication)

export const useRejectAgentApplication = () =>
  useAgentApplicationMutation(rejectAgentApplication)