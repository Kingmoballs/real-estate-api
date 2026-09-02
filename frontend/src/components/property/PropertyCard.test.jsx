import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import PropertyCard from './PropertyCard.jsx'

const property = {
  _id: '68b4f3a5c8a8f8c42b000001',
  title: 'Waterfront shortlet with lagoon views',
  location: 'Lekki Phase 1, Lagos',
  listingType: 'shortlet',
  propertyType: 'apartment',
  price: 75000,
  currency: 'NGN',
  pricePeriod: 'night',
  bedrooms: 2,
  bathrooms: 2,
  ratingAverage: 4.5,
  reviewCount: 8,
  images: [
    {
      url: 'https://res.cloudinary.com/demo/image/upload/property.jpg',
      public_id: 'properties/property',
    },
  ],
}

describe('PropertyCard', () => {
  it('renders an API-shaped property and links to its details route', () => {
    render(
      <MemoryRouter>
        <PropertyCard property={property} />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: property.title }),
    ).toBeInTheDocument()
    expect(screen.getByText(property.location)).toBeInTheDocument()
    expect(screen.queryByText('For rent')).not.toBeInTheDocument()
    expect(screen.getByText('Shortlet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View details' })).toHaveAttribute(
      'href',
      '/properties/' + property._id,
    )
    expect(screen.getByRole('img', { name: property.title })).toHaveAttribute(
      'src',
      property.images[0].url,
    )
  })
})
