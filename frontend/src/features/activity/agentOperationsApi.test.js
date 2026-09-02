import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../lib/api.js'
import {
  approveBooking,
  rejectBooking,
  rejectBookingReceipt,
  verifyBookingReceipt,
} from '../bookings/bookingApi.js'
import {
  completeInspection,
  confirmInspection,
  rejectInspection,
  rescheduleInspection,
} from '../inspections/inspectionApi.js'

vi.mock('../../lib/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('agent operation API adapters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.patch.mockResolvedValue({ data: { message: 'updated' } })
  })

  it('uses the inspection workflow endpoints and payloads', async () => {
    await confirmInspection('inspection-id')
    await rescheduleInspection({
      inspectionId: 'inspection-id',
      proposedFor: '2026-09-12T09:00:00.000Z',
      message: 'Please confirm this new time',
    })
    await rejectInspection({
      inspectionId: 'inspection-id',
      reason: 'Property is no longer available',
    })
    await completeInspection('inspection-id')

    expect(api.patch).toHaveBeenNthCalledWith(
      1,
      '/inspections/inspection-id/confirm',
    )
    expect(api.patch).toHaveBeenNthCalledWith(
      2,
      '/inspections/inspection-id/reschedule',
      {
        proposedFor: '2026-09-12T09:00:00.000Z',
        message: 'Please confirm this new time',
      },
    )
    expect(api.patch).toHaveBeenNthCalledWith(
      3,
      '/inspections/inspection-id/reject',
      { reason: 'Property is no longer available' },
    )
    expect(api.patch).toHaveBeenNthCalledWith(
      4,
      '/inspections/inspection-id/complete',
    )
  })

  it('uses the booking and receipt review endpoints', async () => {
    await approveBooking('booking-id')
    await rejectBooking({ bookingId: 'booking-id', reason: 'Dates conflict' })
    await verifyBookingReceipt('booking-id')
    await rejectBookingReceipt({
      bookingId: 'booking-id',
      reason: 'Transfer reference is not visible',
    })

    expect(api.patch).toHaveBeenNthCalledWith(
      1,
      '/bookings/booking-id/approve',
    )
    expect(api.patch).toHaveBeenNthCalledWith(
      2,
      '/bookings/booking-id/reject',
      { reason: 'Dates conflict' },
    )
    expect(api.patch).toHaveBeenNthCalledWith(
      3,
      '/bookings/booking-id/verify-receipt',
    )
    expect(api.patch).toHaveBeenNthCalledWith(
      4,
      '/bookings/booking-id/reject-receipt',
      { reason: 'Transfer reference is not visible' },
    )
  })
})
