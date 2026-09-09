import { describe, expect, it } from 'vitest'
import { normalizeGeoapifyResult } from './geoapify.js'

describe('Geoapify result normalization', () => {
  it('maps a provider result to the existing property form fields', () => {
    expect(
      normalizeGeoapifyResult({
        formatted: '12 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
        address_line1: '12 Admiralty Way',
        city: 'Lagos',
        state: 'Lagos State',
        county: 'Eti-Osa',
        country: 'Nigeria',
        postcode: '106104',
        lat: 6.4474,
        lon: 3.4722,
      }),
    ).toEqual({
      location: '12 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
      streetAddress: '12 Admiralty Way',
      city: 'Lagos',
      state: 'Lagos State',
      lga: 'Eti-Osa',
      country: 'Nigeria',
      postalCode: '106104',
      latitude: 6.4474,
      longitude: 3.4722,
    })
  })

  it('does not produce invalid coordinates when the provider omits them', () => {
    const result = normalizeGeoapifyResult({
      formatted: 'Lekki, Lagos, Nigeria',
      city: 'Lagos',
      state: 'Lagos State',
      country: 'Nigeria',
    })

    expect(result.latitude).toBeUndefined()
    expect(result.longitude).toBeUndefined()
  })
})
