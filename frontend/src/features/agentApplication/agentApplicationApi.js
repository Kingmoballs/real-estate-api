import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import api from '../../lib/api.js'

export const agentApplicationKeys = {
  mine: [
    'agent-applications',
    'mine',
  ],
}

export const getMyAgentApplication =
  async () => {
    try {
      const response = await api.get(
        '/agent-applications/me',
      )

      return response.data.application
    } catch (error) {
      if (
        error.response?.status === 404
      ) {
        return null
      }

      throw error
    }
  }

export const submitAgentApplication =
  async (application) => {
    const response = await api.post(
      '/agent-applications',
      application,
    )

    return response.data
  }

export const useMyAgentApplication = (
  enabled = true,
) =>
  useQuery({
    queryKey:
      agentApplicationKeys.mine,
    queryFn:
      getMyAgentApplication,
    enabled,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.status ===
      'pending'
        ? 30_000
        : false,
  })

export const useSubmitAgentApplication =
  () => {
    const queryClient =
      useQueryClient()

    return useMutation({
      mutationFn:
        submitAgentApplication,
      onSuccess: (result) => {
        queryClient.setQueryData(
          agentApplicationKeys.mine,
          result.application,
        )
      },
    })
  }