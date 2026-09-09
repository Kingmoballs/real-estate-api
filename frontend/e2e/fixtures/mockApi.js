const image =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"%3E%3Crect width="1200" height="800" fill="%23d6e8df"/%3E%3Cpath d="M180 590 470 300l165 165 110-110 275 235" fill="none" stroke="%23064e3b" stroke-width="42"/%3E%3C/svg%3E'

export const propertyId = '66aa11bb22cc33dd44ee5501'
export const conversationId = '66aa11bb22cc33dd44ee5599'

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
  {
    user = null,
    loginUser,
    propertyOverrides = {},
    includeActivity = false,
  } = {},
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

  const customer = {
    _id: '66aa11bb22cc33dd44ee5520',
    name: 'Tola Customer',
    email: 'tola.customer@example.com',
    phone: '+2348012345678',
    role: 'user',
  }

  const agent = {
    _id: '66aa11bb22cc33dd44ee5510',
    name: 'Ada Agent',
    email: 'ada.agent@example.com',
    phone: '+2348098765432',
    role: 'agent',
  }

  const booking = {
    _id: '66aa11bb22cc33dd44ee5530',
    property,
    guest: customer,
    agent,
    bookingStatus: 'approved',
    paymentStatus: 'unpaid',
    checkInDate: '2026-09-18T12:00:00.000Z',
    checkOutDate: '2026-09-22T12:00:00.000Z',
    numberOfNights: 4,
    totalPrice: 380_000,
    currency: 'NGN',
    message: 'I will arrive in the early afternoon.',
    paymentDueAt: '2026-09-14T18:00:00.000Z',
  }

  const inspection = {
    _id: '66aa11bb22cc33dd44ee5540',
    property,
    customer,
    agent,
    status: 'confirmed',
    requestedFor: '2026-09-16T10:00:00.000Z',
    scheduledFor: '2026-09-16T10:00:00.000Z',
    message: 'Please confirm that parking is available.',
  }

  const review = {
    _id: '66aa11bb22cc33dd44ee5550',
    property,
    propertyAgent: agent,
    customer,
    rating: 5,
    title: 'A smooth and trustworthy experience',
    comment:
      'The home matched the listing and the agent communicated clearly throughout the visit.',
    status: 'published',
    verificationSource: 'inspection',
    createdAt: '2026-09-07T10:00:00.000Z',
    updatedAt: '2026-09-07T10:00:00.000Z',
  }

  const conversation = {
    _id: conversationId,
    property,
    customer,
    agent,
    status: 'open',
    unreadCount: 1,
    lastMessage: {
      content: 'Is the apartment still available?',
      createdAt: '2026-09-09T09:00:00.000Z',
    },
  }

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
      return json(route, { unread: 0, unreadCount: 0 })
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

    if (path === '/dashboard/agent' && method === 'GET') {
      return json(route, {
        summary: {
          totalProperties: 8,
          totalBookings: 14,
          totalRevenue: 2_450_000,
        },
        dateAnalytics: {
          totalBookings: 5,
          totalRevenue: 760_000,
        },
      })
    }

    if (path === '/properties/mine' && method === 'GET') {
      const mine = state.createdProperty || includeActivity ? [property] : []
      return json(route, {
        properties: mine,
        pagination: pagination(mine.length),
      })
    }

    if (path === `/properties/mine/${propertyId}` && method === 'GET') {
      return json(route, { property })
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
      const adminProperties = includeActivity ? [property] : []
      return json(route, {
        properties: adminProperties,
        pagination: pagination(adminProperties.length),
      })
    }

    if (path === '/agent-applications/admin' && method === 'GET') {
      const applications = includeActivity
        ? [
            {
              _id: '66aa11bb22cc33dd44ee5560',
              applicant: customer,
              user: customer,
              phone: customer.phone,
              agencyName: 'Tola Homes',
              experienceYears: 4,
              licenseNumber: 'LASRERA-2026-1088',
              identityType: 'nationalId',
              identityNumber: 'NG-12345678901',
              serviceAreas: ['Lekki', 'Ikoyi'],
              portfolioUrl: 'https://example.com/portfolio',
              bio: 'I help customers find verified homes across Lagos.',
              status: 'pending',
              createdAt: '2026-09-08T10:00:00.000Z',
            },
          ]
        : []
      return json(route, {
        applications,
        pagination: pagination(applications.length),
      })
    }

    if (path === '/agent-applications/me' && method === 'GET') {
      return json(route, { message: 'No application found' }, 404)
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
      const inspections = includeActivity ? [inspection] : []
      return json(route, {
        inspections,
        pagination: pagination(inspections.length),
      })
    }

    if (path === '/inspections/agent' && method === 'GET') {
      const inspections = includeActivity ? [inspection] : []
      return json(route, {
        inspections,
        pagination: pagination(inspections.length),
      })
    }

    if (path === '/inspections/admin' && method === 'GET') {
      const inspections = includeActivity ? [inspection] : []
      return json(route, {
        inspections,
        pagination: pagination(inspections.length),
      })
    }

    if (path === '/bookings/mine' && method === 'GET') {
      const bookings = includeActivity ? [booking] : []
      return json(route, {
        bookings,
        pagination: pagination(bookings.length),
      })
    }

    if (path === '/bookings/agent' && method === 'GET') {
      const bookings = includeActivity ? [booking] : []
      return json(route, {
        bookings,
        pagination: pagination(bookings.length),
      })
    }

    if (path === '/bookings/admin' && method === 'GET') {
      const bookings = includeActivity ? [booking] : []
      return json(route, {
        bookings,
        pagination: pagination(bookings.length),
      })
    }

    if (path === '/saved-properties' && method === 'GET') {
      const savedProperties = includeActivity
        ? [{ _id: '66aa11bb22cc33dd44ee5570', property }]
        : []
      return json(route, {
        savedProperties,
        pagination: pagination(savedProperties.length),
      })
    }

    if (path === '/reviews/mine' && method === 'GET') {
      const reviews = includeActivity ? [review] : []
      return json(route, {
        reviews,
        pagination: pagination(reviews.length),
      })
    }

    if (path === '/reviews/agent' && method === 'GET') {
      const reviews = includeActivity ? [review] : []
      return json(route, {
        reviews,
        pagination: pagination(reviews.length),
      })
    }

    if (path === '/reviews/admin' && method === 'GET') {
      const reviews = includeActivity ? [review] : []
      return json(route, {
        reviews,
        pagination: pagination(reviews.length),
      })
    }

    if (path === '/chats/inbox' && method === 'GET') {
      const conversations = includeActivity ? [conversation] : []
      return json(route, {
        conversations,
        pagination: pagination(conversations.length),
      })
    }

    if (path === `/chats/${conversationId}` && method === 'GET') {
      return json(route, {
        conversation,
        messages: includeActivity
          ? [
              {
                _id: '66aa11bb22cc33dd44ee5580',
                sender: customer,
                content: 'Is the apartment still available for September?',
                readBy: [customer, agent],
                createdAt: '2026-09-09T08:55:00.000Z',
              },
              {
                _id: '66aa11bb22cc33dd44ee5581',
                sender: agent,
                content: 'Yes. I can also arrange an inspection this week.',
                readBy: [agent],
                createdAt: '2026-09-09T09:00:00.000Z',
              },
            ]
          : [],
        pagination: pagination(includeActivity ? 2 : 0),
      })
    }

    if (path === `/chats/${conversationId}/read` && method === 'PATCH') {
      return json(route, { message: 'Conversation marked as read' })
    }

    return json(route, { message: `No E2E mock for ${method} ${path}` }, 404)
  })

  return state
}
