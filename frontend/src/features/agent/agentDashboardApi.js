import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api.js'

export const getAgentDashboard = async (range = '30days') => {
  const response = await api.get('/dashboard/agent', {
    params: { range },
  })
  return response.data
}

export const useAgentDashboard = (range = '30days') =>
  useQuery({
    queryKey: ['agent', 'dashboard', range],
    queryFn: () => getAgentDashboard(range),
  })
