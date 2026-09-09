const image =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"%3E%3Crect width="1200" height="800" fill="%23d6e8df"/%3E%3Cpath d="M180 590 470 300l165 165 110-110 275 235" fill="none" stroke="%23064e3b" stroke-width="42"/%3E%3C/svg%3E'

export const propertyId = '66aa11bb22cc33dd44ee5501'

export const createProperty = (overrides = {}) => ({
  _id: propertyId,
  title: 'Waterfront Apartment in Lekki',
  description:
    'A bright, secure apartment with reliable power and easy access to the city.',
  listingType: 'rent',
  propertyType: 'apartment',
  listingStatus: 'published',
  availabilityStatus: 'available',
  price: 5_500_000,
  pricePeriod: 'year',
  currency: 'NGN',
  location: 'Lekki Phase 1, Lagos',
  address: {
    streetAddress: '10 Admiralty Way',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
  },
  images: [{ url: image, publicId: 'e2e-property-image' }],
  bedrooms: 3,
  bathrooms: 3,
  parkingSpaces: 2,
  furnishingStatus: 'furnished',
  amenities: ['security', 'powerBackup', 'waterSupply'],
  size: { value: 180, unit: 'sqm' },
  ratingAverage: 4.8,
  reviewCount: 12,
  postedBy: {
    _id: '66aa11bb22cc33dd44ee5510',
    name: 'Ada Agent',
    email: 'ada.agent@example.com',
    phone: '+2348012345678',
  },
  createdAt: '2026-09-01T10:00:00.000Z',
  submittedForReviewAt: '2026-09-02T10:00:00.000Z',
  ...overrides,
})

const pagination = (totalItems) => ({
  currentPage: 1,
  totalPages: 1,
  totalItems,
  itemsPerPage: 20,
  hasNextPage: false,
  hasPreviousPage: false,
})

const json = (route, body, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })

export async function installApiMock(
  page,
  { user = null, loginUser, propertyOverrides = {} } = {},
) {
  const state = {
    currentUser: user,
    createdProperty: false,
    approvedProperty: false,
    registered: false,
  }

  const property = createProperty(propertyOverrides)
  const properties = Array.from({ length: 4 }, (_, index) =>
    createProperty({
      _id: `66aa11bb22cc33dd44ee550${index + 1}`,
      title: [
        'Waterfront Apartment in Lekki',
        'Modern Terrace in Ikoyi',
        'Serviced Studio in Abuja',
        'Family Home in Port Harcourt',
      ][index],
      listingType: ['rent', 'sale', 'shortlet', 'rent'][index],
      pricePeriod: ['year', 'total', 'night', 'month'][index],
      price: [5_500_000, 185_000_000, 95_000, 900_000][index],
    }),
  )

  await page.route('https://images.unsplash.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"/>',
    }),
  )

  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const apiMarker = '/api/'
    const markerIndex = url.pathname.indexOf(apiMarker)
    const path =
      markerIndex >= 0
        ? url.pathname.slice(markerIndex + apiMarker.length - 1)
        : url.pathname
    const method = request.method()

    if (path === '/auth/csrf-token' && method === 'GET') {
      return json(route, { csrfToken: 'e2e-csrf-token' })
    }

    if (path === '/auth/me' && method === 'GET') {
      return state.currentUser
        ? json(route, { user: state.currentUser })
        : json(route, { message: 'Not authenticated' }, 401)
    }

    if (path === '/auth/register' && method === 'POST') {
      state.registered = true
      return json(route, { message: 'Account created successfully' }, 201)
    }

    if (path === '/auth/login' && method === 'POST') {
      state.currentUser =
        loginUser || {
          name: 'Tola Customer',
          email: 'tola@example.com',
          role: 'user',
        }
      return json(route, {
        user: state.currentUser,
        csrfToken: 'e2e-csrf-token',
      })
    }

    if (path === '/auth/logout' && method === 'POST') {
      state.currentUser = null
      return json(route, { message: 'Logged out' })
    }

    if (path === '/auth/refresh-token' && method === 'POST') {
      return json(route, { message: 'Not authenticated' }, 401)
    }

    if (path === '/notifications/unread-count' && method === 'GET') {
      return json(route, { unreadCount: 0 })
    }

    if (path === '/notifications' && method === 'GET') {
      return json(route, {
        notifications: [],
        pagination: pagination(0),
      })
    }

    if (path === '/properties' && method === 'GET') {
      return json(route, {
        properties,
        pagination: pagination(properties.length),
      })
    }

    if (path === `/properties/${propertyId}` && method === 'GET') {
      return json(route, { property })
    }

    if (path === '/properties' && method === 'POST') {
      state.createdProperty = true
      return json(
        route,
        {
          message: 'Property submitted for review',
          property: createProperty({ listingStatus: 'pendingReview' }),
        },
        201,
      )
    }

    if (path === '/properties/mine' && method === 'GET') {
      const mine = state.createdProperty ? [property] : []
      return json(route, {
        properties: mine,
        pagination: pagination(mine.length),
      })
    }

    if (path === `/properties/admin/${propertyId}` && method === 'GET') {
      return json(route, {
        property: createProperty({
          listingStatus: state.approvedProperty
            ? 'published'
            : 'pendingReview',
        }),
      })
    }

    if (
      path === `/properties/admin/${propertyId}/approve` &&
      method === 'PATCH'
    ) {
      state.approvedProperty = true
      return json(route, { message: 'Property approved' })
    }

    if (path === '/properties/admin' && method === 'GET') {
      return json(route, {
        properties: [],
        pagination: pagination(0),
      })
    }

    if (path === '/agent-applications/admin' && method === 'GET') {
      return json(route, {
        applications: [],
        pagination: pagination(0),
      })
    }

    if (path === `/saved-properties/${propertyId}/status`) {
      return json(route, { isSaved: false })
    }

    if (path === `/reviews/property/${propertyId}` && method === 'GET') {
      return json(route, {
        reviews: [],
        ratingSummary: { averageRating: 0, reviewCount: 0 },
        pagination: pagination(0),
      })
    }

    if (path === `/reviews/eligibility/${propertyId}` && method === 'GET') {
      return json(route, { eligible: false })
    }

    if (
      path === `/bookings/availability/${propertyId}/calendar` &&
      method === 'GET'
    ) {
      return json(route, { blockedRanges: [] })
    }

    if (path === '/inspections/mine' && method === 'GET') {
      return json(route, {
        inspections: [],
        pagination: pagination(0),
      })
    }

    if (path === '/bookings/mine' && method === 'GET') {
      return json(route, {
        bookings: [],
        pagination: pagination(0),
      })
    }

    if (path === '/saved-properties' && method === 'GET') {
      return json(route, {
        properties: [],
        pagination: pagination(0),
      })
    }

    if (path === '/reviews/mine' && method === 'GET') {
      return json(route, {
        reviews: [],
        pagination: pagination(0),
      })
    }

    return json(route, { message: `No E2E mock for ${method} ${path}` }, 404)
  })

  return state
}
