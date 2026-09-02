import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../lib/api.js'
import {
  checkBookingAvailability,
  getBookingAvailabilityCalendar,
  uploadBookingReceipt,
} from '../bookings/bookingApi.js'
import { createInspection } from '../inspections/inspectionApi.js'
import { setPropertySaved } from '../savedProperties/savedPropertyApi.js'

vi.mock('../../lib/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('customer action API adapters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses idempotent save and delete endpoints', async () => {
    api.put.mockResolvedValue({ data: { message: 'saved' } })
    api.delete.mockResolvedValue({ data: { message: 'removed' } })

    await setPropertySaved({
      propertyId: 'property-id',
      shouldSave: true,
    })
    await setPropertySaved({
      propertyId: 'property-id',
      shouldSave: false,
    })

    expect(api.put).toHaveBeenCalledWith('/saved-properties/property-id')
    expect(api.delete).toHaveBeenCalledWith('/saved-properties/property-id')
  })

  it('passes the inspection request payload unchanged', async () => {
    const payload = {
      property: 'property-id',
      requestedFor: '2026-09-10T10:00:00.000Z',
      message: 'Morning is preferred',
    }
    api.post.mockResolvedValue({ data: { inspection: payload } })

    await createInspection(payload)

    expect(api.post).toHaveBeenCalledWith('/inspections', payload)
  })

  it('checks shortlet availability with date-only query values', async () => {
    api.get.mockResolvedValue({ data: { available: true } })

    await checkBookingAvailability({
      propertyId: 'property-id',
      checkInDate: '2026-09-10',
      checkOutDate: '2026-09-13',
    })

    expect(api.get).toHaveBeenCalledWith(
      '/bookings/availability/property-id',
      {
        params: {
          checkInDate: '2026-09-10',
          checkOutDate: '2026-09-13',
        },
      },
    )
  })

  it('uploads the receipt under the backend receipt field', async () => {
    const file = new File(['receipt'], 'receipt.pdf', {
      type: 'application/pdf',
    })
    api.post.mockResolvedValue({ data: { message: 'uploaded' } })

    await uploadBookingReceipt({
      bookingId: 'booking-id',
      file,
    })

    const [, formData] = api.post.mock.calls[0]
    expect(api.post.mock.calls[0][0]).toBe(
      '/bookings/booking-id/upload-receipt',
    )
    expect(formData.get('receipt')).toBe(file)
  })

  it('loads blocked booking ranges for the calendar', async () => {
    const payload = {
      propertyId: 'property-id',
      from: '2026-09-01',
      to: '2027-09-01',
      blockedRanges: [
        {
          checkInDate: '2026-09-10',
          checkOutDate: '2026-09-14',
          status: 'approved',
        },
      ],
    }

    api.get.mockResolvedValue({
      data: payload,
    })

    await expect(
      getBookingAvailabilityCalendar({
        propertyId: 'property-id',
        from: '2026-09-01',
        to: '2027-09-01',
      }),
    ).resolves.toEqual(payload)

    expect(api.get).toHaveBeenCalledWith(
      '/bookings/availability/property-id/calendar',
      {
        params: {
          from: '2026-09-01',
          to: '2027-09-01',
        },
      },
    )
  })
})
