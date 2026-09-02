import { describe, expect, it } from 'vitest'
import {
  emptyPropertyValues,
  mapPropertyToForm,
  propertySchema,
} from './agentPropertyForm.js'

const validProperty = {
  ...emptyPropertyValues,
  title: 'Modern Lekki apartment',
  description: 'A well maintained home in a secure neighbourhood.',
  city: 'Lagos',
  state: 'Lagos',
  country: 'Nigeria',
  price: 3500000,
}

describe('agent property form contract', () => {
  it.each([
    ['shortlet', 'night'],
    ['rent', 'month'],
    ['rent', 'year'],
    ['sale', 'total'],
  ])('accepts %s listings priced by %s', (listingType, pricePeriod) => {
    const result = propertySchema.safeParse({
      ...validProperty,
      listingType,
      pricePeriod,
    })

    expect(result.success).toBe(true)
  })

  it('rejects a price period that does not match the listing type', () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      listingType: 'sale',
      pricePeriod: 'month',
    })

    expect(result.success).toBe(false)
  })

  it('requires coordinates and size fields in pairs', () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      latitude: 6.45,
      sizeValue: 230,
    })

    expect(result.success).toBe(false)
    expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
      expect.arrayContaining(['latitude', 'sizeValue']),
    )
  })

  it('maps nested property data into editable form values', () => {
    const values = mapPropertyToForm({
      title: 'Mapped property',
      description: 'Mapped property description',
      listingType: 'sale',
      propertyType: 'house',
      price: 95000000,
      currency: 'NGN',
      pricePeriod: 'total',
      address: {
        city: 'Abuja',
        state: 'FCT',
        country: 'Nigeria',
      },
      geoLocation: { coordinates: [7.49, 9.07] },
      size: { value: 400, unit: 'sqm' },
    })

    expect(values.city).toBe('Abuja')
    expect(values.longitude).toBe(7.49)
    expect(values.latitude).toBe(9.07)
    expect(values.sizeValue).toBe(400)
    expect(values.sizeUnit).toBe('sqm')
  })
})
