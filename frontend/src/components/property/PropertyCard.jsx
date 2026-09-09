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

function PropertyCard({ property, compact = false }) {
  const routeLocation = useLocation()
  const propertyId = getPropertyId(property)
  const location = getPropertyLocation(property) || 'Location available on request'
  const size = formatPropertySize(property)

  return (
    <article className="group overflow-hidden rounded-[1.1rem] border border-stone-200 bg-white shadow-[0_14px_45px_rgba(28,44,36,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(28,44,36,0.13)] sm:rounded-[1.4rem]">
      <div className="relative">
        <PropertyImage
          property={property}
          className="aspect-[4/3] w-full"
          imageClassName="transition duration-500 group-hover:scale-[1.04]"
          sizes={
            compact
              ? '(min-width: 1024px) 25vw, 50vw'
              : '(min-width: 1280px) 33vw, 50vw'
          }
        />
        <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-extrabold text-emerald-950 shadow-sm sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs">
          {listingLabels[property.listingType] || 'Available'}
        </span>
        {property.reviewCount > 0 && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-emerald-950/90 px-2 py-1 text-[10px] font-extrabold text-white shadow-sm sm:right-4 sm:top-4 sm:px-2.5 sm:py-1.5 sm:text-xs">
            <Star size={12} fill="currentColor" />
            {Number(property.ratingAverage || 0).toFixed(1)}
          </span>
        )}
      </div>

      <div className="p-3 sm:p-5">
        <div className="mb-2 flex items-center gap-1 text-[10px] font-semibold text-stone-500 sm:mb-3 sm:gap-1.5 sm:text-xs">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">{location}</span>
        </div>
        <h3 className="line-clamp-2 min-h-10 text-sm font-extrabold leading-5 tracking-[-0.02em] text-stone-900 sm:min-h-12 sm:text-lg sm:leading-6">
          {property.title}
        </h3>
        <div className="mt-3 flex min-h-10 items-center gap-2 border-y border-stone-100 py-2 text-xs text-stone-600 sm:mt-4 sm:min-h-12 sm:gap-4 sm:py-3 sm:text-sm">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <BedDouble size={15} />
              {property.bedrooms}
              <span className="hidden sm:inline">beds</span>
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bath size={15} />
              {property.bathrooms}
              <span className="hidden sm:inline">baths</span>
            </span>
          )}
          {size && (
            <span
              className={
                compact
                  ? 'hidden'
                  : 'hidden items-center gap-1.5 xl:flex'
              }
            >
              <Maximize2 size={15} /> {size}
            </span>
          )}
          <span
            className={
              compact
                ? 'hidden'
                : 'ml-auto hidden text-xs font-bold uppercase tracking-wide text-stone-400 xl:block'
            }
          >
            {formatPropertyType(property.propertyType)}
          </span>
        </div>
        <div className="mt-3 sm:mt-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <p className="line-clamp-2 text-sm font-black leading-5 tracking-[-0.03em] text-emerald-950 sm:text-lg">
            {formatPropertyPrice(property)}
          </p>
          <Link
            to={'/properties/' + propertyId}
            state={{ from: routeLocation.pathname + routeLocation.search }}
            aria-label="View details"
            className="focus-ring mt-2 inline-flex shrink-0 text-xs font-extrabold text-amber-700 hover:text-amber-800 sm:mt-0 sm:text-sm"
          >
            <span className="sm:hidden">View</span>
            <span className="hidden sm:inline">View details</span>
          </Link>
        </div>
      </div>
    </article>
  )
}

export default PropertyCard
