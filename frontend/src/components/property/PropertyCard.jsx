import { Bath, BedDouble, MapPin, Maximize2, Star } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import {
  formatPropertyPrice,
  formatPropertySize,
  formatPropertyType,
  getPropertyId,
  getPropertyLocation,
} from '../../features/properties/propertyFormatters.js'
import PropertyImage from './PropertyImage.jsx'

const listingLabels = {
  sale: 'For sale',
  rent: 'For rent',
  shortlet: 'Shortlet',
}

function PropertyCard({ property }) {
  const routeLocation = useLocation()
  const propertyId = getPropertyId(property)
  const location = getPropertyLocation(property) || 'Location available on request'
  const size = formatPropertySize(property)

  return (
    <article className="group overflow-hidden rounded-[1.4rem] border border-stone-200 bg-white shadow-[0_14px_45px_rgba(28,44,36,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(28,44,36,0.13)]">
      <div className="relative">
        <PropertyImage
          property={property}
          className="aspect-[4/3] w-full"
          imageClassName="transition duration-500 group-hover:scale-[1.04]"
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold text-emerald-950 shadow-sm">
          {listingLabels[property.listingType] || 'Available'}
        </span>
        {property.reviewCount > 0 && (
          <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-emerald-950/90 px-2.5 py-1.5 text-xs font-extrabold text-white shadow-sm">
            <Star size={13} fill="currentColor" />
            {Number(property.ratingAverage || 0).toFixed(1)}
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate">{location}</span>
        </div>
        <h3 className="min-h-12 text-lg font-extrabold leading-6 tracking-[-0.02em] text-stone-900">
          {property.title}
        </h3>
        <div className="mt-4 flex min-h-12 items-center gap-4 border-y border-stone-100 py-3 text-sm text-stone-600">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1.5">
              <BedDouble size={16} /> {property.bedrooms} beds
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1.5">
              <Bath size={16} /> {property.bathrooms} baths
            </span>
          )}
          {size && (
            <span className="flex items-center gap-1.5">
              <Maximize2 size={15} /> {size}
            </span>
          )}
          <span className="ml-auto text-xs font-bold uppercase tracking-wide text-stone-400">
            {formatPropertyType(property.propertyType)}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-lg font-black tracking-[-0.03em] text-emerald-950">
            {formatPropertyPrice(property)}
          </p>
          <Link
            to={'/properties/' + propertyId}
            state={{ from: routeLocation.pathname + routeLocation.search }}
            className="focus-ring shrink-0 text-sm font-extrabold text-amber-700 hover:text-amber-800"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  )
}

export default PropertyCard
