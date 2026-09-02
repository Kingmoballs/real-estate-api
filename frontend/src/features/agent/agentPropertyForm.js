import { z } from 'zod'

export const propertyTypes = [
  ['apartment', 'Apartment'],
  ['house', 'House'],
  ['duplex', 'Duplex'],
  ['bungalow', 'Bungalow'],
  ['land', 'Land'],
  ['commercial', 'Commercial'],
  ['office', 'Office'],
  ['shop', 'Shop'],
  ['warehouse', 'Warehouse'],
]

export const amenities = [
  ['airConditioning', 'Air conditioning'],
  ['balcony', 'Balcony'],
  ['elevator', 'Elevator'],
  ['fencedCompound', 'Fenced compound'],
  ['garden', 'Garden'],
  ['gym', 'Gym'],
  ['internet', 'Internet'],
  ['kitchen', 'Kitchen'],
  ['parking', 'Parking'],
  ['petFriendly', 'Pet friendly'],
  ['powerBackup', 'Power backup'],
  ['security', 'Security'],
  ['swimmingPool', 'Swimming pool'],
  ['washingMachine', 'Washing machine'],
  ['waterSupply', 'Water supply'],
]

const optionalNumber = z.number().nonnegative().optional()
const maximumYearBuilt = new Date().getFullYear() + 1

export const propertySchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(10).max(5000),
    location: z.string().trim().max(300).optional(),
    streetAddress: z.string().trim().max(200).optional(),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    lga: z.string().trim().max(100).optional(),
    country: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().max(20).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    listingType: z.enum(['shortlet', 'rent', 'sale']),
    propertyType: z.enum([
      'apartment',
      'house',
      'duplex',
      'bungalow',
      'land',
      'commercial',
      'office',
      'shop',
      'warehouse',
    ]),
    price: z.number().positive(),
    currency: z.enum(['NGN', 'USD']),
    pricePeriod: z.enum(['night', 'month', 'year', 'total']),
    bedrooms: z.number().int().nonnegative(),
    bathrooms: z.number().int().nonnegative(),
    furnishingStatus: z.enum([
      'unfurnished',
      'semiFurnished',
      'furnished',
    ]),
    amenities: z.array(z.string()),
    sizeValue: z.number().positive().optional(),
    sizeUnit: z.enum(['sqm', 'sqft', 'acre', 'hectare']).optional(),
    parkingSpaces: z.number().int().nonnegative(),
    yearBuilt: z
      .number()
      .int()
      .min(1800)
      .max(maximumYearBuilt)
      .optional(),
    serviceCharge: optionalNumber,
    securityDeposit: optionalNumber,
    cleaningFee: optionalNumber,
  })
  .superRefine((values, context) => {
    const validPeriods = {
      shortlet: ['night'],
      rent: ['month', 'year'],
      sale: ['total'],
    }

    if (!validPeriods[values.listingType].includes(values.pricePeriod)) {
      context.addIssue({
        code: 'custom',
        path: ['pricePeriod'],
        message: 'Choose a price period that matches the listing type',
      })
    }

    if (
      (values.latitude === undefined) !==
      (values.longitude === undefined)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['latitude'],
        message: 'Latitude and longitude must be provided together',
      })
    }

    if (
      (values.sizeValue === undefined) !==
      (values.sizeUnit === undefined)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['sizeValue'],
        message: 'Property size and size unit must be provided together',
      })
    }
  })

export const emptyPropertyValues = {
  title: '',
  description: '',
  location: '',
  streetAddress: '',
  city: '',
  state: '',
  lga: '',
  country: 'Nigeria',
  postalCode: '',
  latitude: undefined,
  longitude: undefined,
  listingType: 'rent',
  propertyType: 'apartment',
  price: undefined,
  currency: 'NGN',
  pricePeriod: 'year',
  bedrooms: 0,
  bathrooms: 0,
  furnishingStatus: 'unfurnished',
  amenities: [],
  sizeValue: undefined,
  sizeUnit: undefined,
  parkingSpaces: 0,
  yearBuilt: undefined,
  serviceCharge: 0,
  securityDeposit: 0,
  cleaningFee: 0,
}

export const mapPropertyToForm = (property) => ({
  ...emptyPropertyValues,
  title: property.title || '',
  description: property.description || '',
  location: property.location || '',
  streetAddress: property.address?.streetAddress || '',
  city: property.address?.city || '',
  state: property.address?.state || '',
  lga: property.address?.lga || '',
  country: property.address?.country || 'Nigeria',
  postalCode: property.address?.postalCode || '',
  latitude: property.geoLocation?.coordinates?.[1],
  longitude: property.geoLocation?.coordinates?.[0],
  listingType: property.listingType,
  propertyType: property.propertyType,
  price: property.price,
  currency: property.currency,
  pricePeriod: property.pricePeriod,
  bedrooms: property.bedrooms || 0,
  bathrooms: property.bathrooms || 0,
  furnishingStatus: property.furnishingStatus || 'unfurnished',
  amenities: property.amenities || [],
  sizeValue: property.size?.value || undefined,
  sizeUnit: property.size?.value ? property.size.unit : undefined,
  parkingSpaces: property.parkingSpaces || 0,
  yearBuilt: property.yearBuilt || undefined,
  serviceCharge: property.serviceCharge || 0,
  securityDeposit: property.securityDeposit || 0,
  cleaningFee: property.cleaningFee || 0,
})

export const numberInputOptions = {
  setValueAs: (value) => (value === '' ? undefined : Number(value)),
}
