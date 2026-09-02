import {
  AlertTriangle,
  ArrowLeft,
  Bath,
  BedDouble,
  Car,
  Check,
  Mail,
  MapPin,
  Maximize2,
  Phone,
  Sofa,
  Star,
  UserRound,
} from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import BookingRequestForm from '../components/property/BookingRequestForm.jsx'
import InspectionRequestForm from '../components/property/InspectionRequestForm.jsx'
import PropertyGallery from '../components/property/PropertyGallery.jsx'
import SavePropertyButton from '../components/property/SavePropertyButton.jsx'
import PropertyReviews from '../components/property/PropertyReviews.jsx'
import PropertyInquiryForm from '../components/property/PropertyInquiryForm.jsx'
import { useProperty } from '../features/properties/propertyApi.js'
import {
  formatAmenity,
  formatPropertyPrice,
  formatPropertySize,
  formatPropertyType,
  getPropertyLocation,
} from '../features/properties/propertyFormatters.js'
import { getApiErrorMessage } from '../lib/errors.js'

const listingLabels = {
  sale: 'Property for sale',
  rent: 'Long-term rental',
  shortlet: 'Serviced shortlet',
}

const formatAmount = (amount, currency = 'NGN') =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)

function DetailSkeleton() {
  return (
    <main className="page-shell animate-pulse py-10 sm:py-14">
      <div className="mb-6 h-5 w-40 rounded bg-stone-200" />
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="aspect-[4/3] rounded-[2rem] bg-stone-200" />
        <div className="space-y-5 rounded-[2rem] border border-stone-200 bg-white p-8">
          <div className="h-4 w-28 rounded bg-stone-200" />
          <div className="h-10 w-4/5 rounded bg-stone-200" />
          <div className="h-5 w-2/3 rounded bg-stone-100" />
          <div className="h-20 rounded bg-stone-100" />
          <div className="h-9 w-1/2 rounded bg-stone-200" />
        </div>
      </div>
    </main>
  )
}

function PropertyDetailsPage() {
  const { propertyId } = useParams()
  const routeLocation = useLocation()
  const { data: property, error, isError, isLoading, refetch } =
    useProperty(propertyId)

  if (isLoading) return <DetailSkeleton />

  if (isError) {
    const notFound = error.response?.status === 404

    return (
      <main className="page-shell py-20 text-center">
        <AlertTriangle className="mx-auto text-amber-700" size={34} />
        <h1 className="mt-4 text-3xl font-black text-stone-900">
          {notFound ? 'Property not found' : 'We could not load this property'}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-stone-500">
          {notFound
            ? 'This listing may no longer be published or the link may be incorrect.'
            : getApiErrorMessage(error, 'Please check your connection and try again.')}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {!notFound && (
            <button
              type="button"
              onClick={() => refetch()}
              className="focus-ring cursor-pointer rounded-xl bg-emerald-950 px-5 py-3 text-sm font-black text-white"
            >
              Try again
            </button>
          )}
          <Link
            to="/properties"
            className="focus-ring rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-black text-stone-700"
          >
            Browse properties
          </Link>
        </div>
      </main>
    )
  }

  const backPath = routeLocation.state?.from || '/properties'
  const propertyLocation =
    getPropertyLocation(property) || 'Location available on request'
  const size = formatPropertySize(property)
  const agent = {
    name: property.postedBy?.name || property.agentName,
    email: property.postedBy?.email || property.agentEmail,
    phone: property.postedBy?.phone || property.agentPhone,
  }
  const propertyFacts = [
    property.bedrooms > 0 && {
      icon: BedDouble,
      label: 'Bedrooms',
      value: property.bedrooms,
    },
    property.bathrooms > 0 && {
      icon: Bath,
      label: 'Bathrooms',
      value: property.bathrooms,
    },
    size && { icon: Maximize2, label: 'Property size', value: size },
    property.parkingSpaces > 0 && {
      icon: Car,
      label: 'Parking spaces',
      value: property.parkingSpaces,
    },
    property.furnishingStatus && {
      icon: Sofa,
      label: 'Furnishing',
      value: formatAmenity(property.furnishingStatus),
    },
  ].filter(Boolean)
  const fees = [
    ['Service charge', property.serviceCharge],
    ['Security deposit', property.securityDeposit],
    ['Cleaning fee', property.cleaningFee],
  ].filter(([, amount]) => amount > 0)

  return (
    <main className="page-shell py-8 sm:py-12">
      <Link
        to={backPath}
        className="focus-ring mb-6 flex w-fit items-center gap-2 text-sm font-bold text-stone-600 hover:text-emerald-900"
      >
        <ArrowLeft size={17} /> Back to properties
      </Link>

      <PropertyGallery property={property} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <div>
          <div className="rounded-[2rem] border border-stone-200 bg-white p-7 shadow-sm sm:p-9">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-extrabold text-emerald-900">
                {listingLabels[property.listingType] || 'Published property'}
              </span>
              <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-extrabold text-stone-600">
                {formatPropertyType(property.propertyType)}
              </span>
              {property.reviewCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-extrabold text-amber-800">
                  <Star size={13} fill="currentColor" />
                  {Number(property.ratingAverage || 0).toFixed(1)} ·{' '}
                  {property.reviewCount} reviews
                </span>
              )}
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-[-0.045em] text-stone-900 sm:text-5xl">
              {property.title}
            </h1>
            <p className="mt-4 flex items-start gap-2 text-sm font-semibold text-stone-500">
              <MapPin size={18} className="mt-0.5 shrink-0 text-amber-700" />
              {propertyLocation}
            </p>

            {propertyFacts.length > 0 && (
              <div className="mt-7 grid gap-3 border-y border-stone-100 py-6 sm:grid-cols-2 xl:grid-cols-3">
                {propertyFacts.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-stone-100 text-emerald-900">
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-stone-400">{label}</p>
                      <p className="mt-0.5 text-sm font-extrabold text-stone-800">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-xl font-black text-stone-900">
                About this property
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-600">
                {property.description}
              </p>
            </div>

            {property.amenities?.length > 0 && (
              <div className="mt-8 border-t border-stone-100 pt-8">
                <h2 className="text-xl font-black text-stone-900">
                  Amenities
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {property.amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="flex items-center gap-2 text-sm font-semibold text-stone-600"
                    >
                      <span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                        <Check size={14} strokeWidth={3} />
                      </span>
                      {formatAmenity(amenity)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <div className="rounded-[1.6rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(28,44,36,0.08)]">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-stone-400">
              Asking price
            </p>
            <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-emerald-950">
              {formatPropertyPrice(property)}
            </p>
            {fees.length > 0 && (
              <dl className="mt-5 space-y-2 border-t border-stone-100 pt-5">
                {fees.map(([label, amount]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 text-xs"
                  >
                    <dt className="font-semibold text-stone-500">{label}</dt>
                    <dd className="font-extrabold text-stone-800">
                      {formatAmount(amount, property.currency)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            <SavePropertyButton propertyId={property._id} />
          </div>

          {property.listingType === 'shortlet' ? (
            <BookingRequestForm property={property} />
          ) : (
            <InspectionRequestForm propertyId={property._id} />
          )}

          <PropertyInquiryForm
            property={property}
          />

          <div className="rounded-[1.6rem] bg-emerald-950 p-6 text-white">
            <span className="grid size-11 place-items-center rounded-xl bg-white/10">
              <UserRound size={21} />
            </span>
            <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-200">
              Listed by
            </p>
            <h2 className="mt-1 text-xl font-black">
              {agent.name || 'Verified property agent'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-emerald-100/70">
              Use the platform request form above for scheduling. You can also
              contact the listing agent directly with property questions.
            </p>
            <div className="mt-5 grid gap-3">
              {agent.phone && (
                <a
                  href={'tel:' + agent.phone}
                  className="focus-ring flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-emerald-950"
                >
                  <Phone size={17} /> Call agent
                </a>
              )}
              {agent.email && (
                <a
                  href={'mailto:' + agent.email}
                  className="focus-ring flex items-center justify-center gap-2 rounded-xl border border-emerald-700 px-4 py-3 text-sm font-black text-white"
                >
                  <Mail size={17} /> Email agent
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>

      <PropertyReviews propertyId={property._id} />
    </main>
  )
}

export default PropertyDetailsPage
