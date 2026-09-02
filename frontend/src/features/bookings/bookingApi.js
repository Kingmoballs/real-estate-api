import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api.js'

export const checkBookingAvailability = async ({
  propertyId,
  checkInDate,
  checkOutDate,
}) => {
  const response = await api.get('/bookings/availability/' + propertyId, {
    params: { checkInDate, checkOutDate },
  })
  return response.data
}

export const getBookingAvailabilityCalendar = async ({
  propertyId,
  from,
  to,
}) => {
  const response = await api.get(
    '/bookings/availability/' +
      propertyId +
      '/calendar',
    {
      params: { from, to },
    },
  )

  return response.data
}

export const createBooking = async (payload) => {
  const response = await api.post('/bookings', payload)
  return response.data
}

export const getMyBookings = async (params = {}) => {
  const response = await api.get('/bookings/mine', { params })
  return response.data
}

export const getAgentBookings = async (params = {}) => {
  const response = await api.get('/bookings/agent', { params })
  return response.data
}

export const getAdminBookings = async (params = {}) => {
  const response = await api.get('/bookings/admin', { params })
  return response.data
}

export const cancelBooking = async ({ bookingId, reason }) => {
  const response = await api.patch('/bookings/' + bookingId + '/cancel', {
    reason,
  })
  return response.data
}

export const uploadBookingReceipt = async ({ bookingId, file }) => {
  const formData = new FormData()
  formData.append('receipt', file)

  const response = await api.post(
    '/bookings/' + bookingId + '/upload-receipt',
    formData,
  )
  return response.data
}

export const approveBooking = async (bookingId) => {
  const response = await api.patch('/bookings/' + bookingId + '/approve')
  return response.data
}

export const rejectBooking = async ({ bookingId, reason }) => {
  const response = await api.patch('/bookings/' + bookingId + '/reject', {
    reason,
  })
  return response.data
}

export const verifyBookingReceipt = async (bookingId) => {
  const response = await api.patch(
    '/bookings/' + bookingId + '/verify-receipt',
  )
  return response.data
}

export const rejectBookingReceipt = async ({ bookingId, reason }) => {
  const response = await api.patch(
    '/bookings/' + bookingId + '/reject-receipt',
    { reason },
  )
  return response.data
}

export const useBookingAvailability = () =>
  useMutation({ mutationFn: checkBookingAvailability })

export const useBookingAvailabilityCalendar = ({
  propertyId,
  from,
  to,
}) =>
  useQuery({
    queryKey: [
      'bookings',
      'availability-calendar',
      propertyId,
      from,
      to,
    ],
    queryFn: () =>
      getBookingAvailabilityCalendar({
        propertyId,
        from,
        to,
      }),
    enabled: Boolean(propertyId && from && to),
  })

export const useMyBookings = (params = {}) =>
  useQuery({
    queryKey: ['bookings', 'mine', params],
    queryFn: () => getMyBookings(params),
    placeholderData: keepPreviousData,
  })

export const useAgentBookings = (params = {}) =>
  useQuery({
    queryKey: ['bookings', 'agent', params],
    queryFn: () => getAgentBookings(params),
    placeholderData: keepPreviousData,
  })

export const useAdminBookings = (params = {}) =>
  useQuery({
    queryKey: ['bookings', 'admin', params],
    queryFn: () => getAdminBookings(params),
    placeholderData: keepPreviousData,
  })

const useBookingMutation = (mutationFn) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  })
}

export const useCreateBooking = () => useBookingMutation(createBooking)
export const useCancelBooking = () => useBookingMutation(cancelBooking)
export const useUploadBookingReceipt = () =>
  useBookingMutation(uploadBookingReceipt)

export const useApproveBooking = () =>
  useBookingMutation(approveBooking)

export const useRejectBooking = () =>
  useBookingMutation(rejectBooking)

export const useVerifyBookingReceipt = () =>
  useBookingMutation(verifyBookingReceipt)

export const useRejectBookingReceipt = () =>
  useBookingMutation(rejectBookingReceipt)
