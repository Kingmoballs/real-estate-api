import { ArrowRight, BadgeCheck, MapPin, Search, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PropertyCard from '../components/property/PropertyCard.jsx'
import PropertyCardSkeleton from '../components/property/PropertyCardSkeleton.jsx'
import { useProperties } from '../features/properties/propertyApi.js'
import { getPropertyId } from '../features/properties/propertyFormatters.js'

const listingOptions = [
  { value: 'sale', label: 'Buy' },
  { value: 'rent', label: 'Rent' },
  { value: 'shortlet', label: 'Shortlet' },
]

function HomePage() {
  const [listingType, setListingType] = useState('rent')
  const [location, setLocation] = useState('')
  const navigate = useNavigate()
  const {
    data: featuredData,
    isError: featuredError,
    isLoading: featuredLoading,
  } = useProperties({ limit: 3, sort: 'newest' })
  const featuredProperties = featuredData?.properties || []

  const handleSearch = (event) => {
    event.preventDefault()
    const params = new URLSearchParams({ listingType })

    if (location.trim()) params.set('search', location.trim())
    navigate(`/properties?${params.toString()}`)
  }

  return (
    <main>
      <section className="page-shell grid gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:py-14">
        <div className="flex flex-col justify-center rounded-[2rem] bg-emerald-950 px-6 py-10 text-white sm:px-10 lg:px-12 lg:py-14">
          <span className="mb-5 flex w-fit items-center gap-2 rounded-full border border-emerald-700 bg-emerald-900/70 px-3 py-1.5 text-xs font-bold text-emerald-100">
            <BadgeCheck size={15} /> Verified listings. Clear decisions.
          </span>
          <h1 className="max-w-2xl text-4xl font-black leading-[1.03] tracking-[-0.055em] sm:text-5xl lg:text-[4rem]">
            Find a place that fits the way you want to live.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-emerald-100/75 sm:text-lg">
            Explore trusted homes for sale, long-term rentals, and fully serviced shortlets across Nigeria.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-8 rounded-2xl bg-white p-2.5 text-stone-900 shadow-2xl shadow-emerald-950/25"
          >
            <div className="mb-2 flex gap-1 rounded-xl bg-stone-100 p-1">
              {listingOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setListingType(option.value)}
                  className={`focus-ring flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm font-extrabold transition ${
                    listingType === option.value
                      ? 'bg-emerald-950 text-white shadow-sm'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-stone-200 px-4 py-3.5 focus-within:border-emerald-700">
                <MapPin size={19} className="shrink-0 text-amber-700" />
                <span className="sr-only">Search location</span>
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Try Lekki, Abuja, or Port Harcourt"
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-stone-400"
                />
              </label>
              <button
                type="submit"
                className="focus-ring flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 py-3.5 text-sm font-black text-white transition hover:bg-amber-700"
              >
                <Search size={18} /> Search
              </button>
            </div>
          </form>
        </div>

        <div className="relative min-h-[390px] overflow-hidden rounded-[2rem] bg-stone-300 lg:min-h-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=86"
            alt="Modern luxury home exterior"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-4 rounded-2xl border border-white/20 bg-white/90 p-4 shadow-xl backdrop-blur-md sm:bottom-7 sm:left-7 sm:right-7">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-amber-700">Freshly verified</p>
              <p className="mt-1 font-black text-emerald-950">New homes added every week</p>
            </div>
            <ShieldCheck className="shrink-0 text-emerald-800" size={30} />
          </div>
        </div>
      </section>

      <section className="page-shell py-12 sm:py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Curated for you</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-stone-900 sm:text-4xl">
              Places worth seeing
            </h2>
          </div>
          <Link
            to="/properties"
            className="focus-ring flex items-center gap-2 self-start text-sm font-extrabold text-emerald-900 sm:self-auto"
          >
            Browse all properties <ArrowRight size={17} />
          </Link>
        </div>

        {featuredLoading && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <PropertyCardSkeleton key={index} />
            ))}
          </div>
        )}

        {!featuredLoading && !featuredError && featuredProperties.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredProperties.map((property) => (
              <PropertyCard key={getPropertyId(property)} property={property} />
            ))}
          </div>
        )}

        {!featuredLoading && !featuredError && featuredProperties.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
            <h3 className="text-lg font-black text-stone-900">
              New properties are coming soon
            </h3>
            <p className="mt-2 text-sm text-stone-500">
              Approved listings will appear here as soon as agents publish them.
            </p>
          </div>
        )}

        {featuredError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center">
            <h3 className="text-lg font-black text-stone-900">
              Featured properties are temporarily unavailable
            </h3>
            <Link
              to="/properties"
              className="focus-ring mt-3 inline-block text-sm font-extrabold text-emerald-900"
            >
              Open the property marketplace
            </Link>
          </div>
        )}
      </section>

      <section className="page-shell py-8 sm:py-12">
        <div className="grid gap-6 rounded-[2rem] border border-stone-200 bg-white p-7 shadow-sm md:grid-cols-3 md:p-10">
          {[
            ['01', 'Explore confidently', 'Search dedicated sale, rent, and shortlet collections.'],
            ['02', 'Compare clearly', 'Review useful property details, costs, and locations in one place.'],
            ['03', 'Act securely', 'Save homes, request inspections, or book shortlets from your account.'],
          ].map(([number, title, description]) => (
            <div key={number} className="border-stone-200 md:border-l md:pl-7 first:md:border-l-0 first:md:pl-0">
              <span className="text-xs font-black text-amber-700">{number}</span>
              <h3 className="mt-3 text-lg font-black text-stone-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export default HomePage
