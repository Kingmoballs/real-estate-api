import { describe, expect, it } from 'vitest'
import {
  formatAmenity,
  formatPropertyPrice,
  getPropertyLocation,
} from './propertyFormatters.js'

describe('property formatters', () => {
  it('builds a location from structured address fields', () => {
    expect(
      getPropertyLocation({
        address: { city: 'Lekki', state: 'Lagos', country: 'Nigeria' },
      }),
    ).toBe('Lekki, Lagos, Nigeria')
  })

  it('formats recurring and total property prices', () => {
    expect(
      formatPropertyPrice({
        price: 5000000,
        currency: 'NGN',
        pricePeriod: 'year',
      }),
    ).toContain('/ year')
    expect(
      formatPropertyPrice({
        price: 250000000,
        currency: 'NGN',
        pricePeriod: 'total',
      }),
    ).not.toContain('/ total')
  })

  it('turns stored amenity keys into readable labels', () => {
    expect(formatAmenity('powerBackup')).toBe('Power Backup')
  })
})
