import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import PropertyCard from '../components/property/PropertyCard.jsx'
import PropertyCardSkeleton from '../components/property/PropertyCardSkeleton.jsx'
import { useProperties } from '../features/properties/propertyApi.js'
import { getPropertyId } from '../features/properties/propertyFormatters.js'
import { getApiErrorMessage } from '../lib/errors.js'

const listingFilters = [
  { value: '', label: 'All properties' },
  { value: 'sale', label: 'For sale' },
  { value: 'rent', label: 'For rent' },
  { value: 'shortlet', label: 'Shortlets' },
]

const propertyTypes = [
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

const queryKeys = [
  'listingType',
  'propertyType',
  'search',
  'minPrice',
  'maxPrice',
  'bedrooms',
  'bathrooms',
  'sort',
  'page',
]

function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(Number(searchParams.get('page')) || 1, 1)
  const apiParams = Object.fromEntries(
    queryKeys
      .map((key) => [key, searchParams.get(key)])
      .filter(([, value]) => value),
  )
  apiParams.limit = 12

  const {
    data,
    error,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useProperties(apiParams)

  const properties = data?.properties || []
  const pagination = data?.pagination

  const updateParams = (updates, resetPage = true) => {
    const nextParams = new URLSearchParams(searchParams)

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        nextParams.set(key, value)
      } else {
        nextParams.delete(key)
      }
    })

    if (resetPage) nextParams.delete('page')
    setSearchParams(nextParams)
  }

  const handleFilterSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    updateParams({
      search: formData.get('search')?.toString().trim(),
      minPrice: formData.get('minPrice')?.toString().trim(),
      maxPrice: formData.get('maxPrice')?.toString().trim(),
    })
  }

  const hasFilters = queryKeys.some(
    (key) => key !== 'page' && searchParams.has(key),
  )

  const firstResult = pagination?.totalItems
    ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1
    : 0
  const lastResult = pagination?.totalItems
    ? Math.min(
        pagination.currentPage * pagination.itemsPerPage,
        pagination.totalItems,
      )
    : 0

  return (
    <main className="page-shell py-10 sm:py-14">
      <div className="max-w-2xl">
        <p className="eyebrow">Property marketplace</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-stone-900 sm:text-5xl">
          Find your next place
        </h1>
        <p className="mt-4 leading-7 text-stone-500">
          Search approved homes for sale, long-term rentals, and serviced shortlets.
        </p>
      </div>

      <section className="mt-8 rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 flex items-center gap-2 px-2 text-sm font-bold text-stone-500">
            <SlidersHorizontal size={17} /> Listing type
          </span>
          {listingFilters.map((filter) => {
            const isSelected =
              (searchParams.get('listingType') || '') === filter.value

            return (
              <button
                key={filter.label}
                type="button"
                onClick={() => updateParams({ listingType: filter.value })}
                className={
                  'focus-ring cursor-pointer rounded-full px-4 py-2 text-sm font-extrabold transition ' +
                  (isSelected
                    ? 'bg-emerald-950 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200')
                }
              >
                {filter.label}
              </button>
            )
          })}
        </div>

        <form
          key={searchParams.toString()}
          onSubmit={handleFilterSubmit}
          className="mt-5 grid gap-3 border-t border-stone-100 pt-5 md:grid-cols-2 xl:grid-cols-[1.7fr_1fr_0.75fr_0.75fr_auto]"
        >
          <label className="relative">
            <span className="sr-only">Search properties</span>
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              name="search"
              type="search"
              maxLength={100}
              defaultValue={searchParams.get('search') || ''}
              placeholder="Search location or property"
              className="focus-ring h-12 w-full rounded-xl border border-stone-300 bg-white pl-10 pr-4 text-sm"
            />
          </label>

          <label>
            <span className="sr-only">Property type</span>
            <select
              value={searchParams.get('propertyType') || ''}
              onChange={(event) =>
                updateParams({ propertyType: event.target.value })
              }
              className="focus-ring h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700"
            >
              <option value="">Any property type</option>
              {propertyTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Minimum price</span>
            <input
              name="minPrice"
              type="number"
              min="0"
              defaultValue={searchParams.get('minPrice') || ''}
              placeholder="Min price"
              className="focus-ring h-12 w-full rounded-xl border border-stone-300 px-3 text-sm"
            />
          </label>

          <label>
            <span className="sr-only">Maximum price</span>
            <input
              name="maxPrice"
              type="number"
              min="0"
              defaultValue={searchParams.get('maxPrice') || ''}
              placeholder="Max price"
              className="focus-ring h-12 w-full rounded-xl border border-stone-300 px-3 text-sm"
            />
          </label>

          <button
            type="submit"
            className="focus-ring h-12 cursor-pointer rounded-xl bg-amber-600 px-5 text-sm font-black text-white transition hover:bg-amber-700"
          >
            Apply filters
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-bold text-stone-500">
            Bedrooms
            <select
              value={searchParams.get('bedrooms') || ''}
              onChange={(event) => updateParams({ bedrooms: event.target.value })}
              className="focus-ring rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-sm text-stone-700"
            >
              <option value="">Any</option>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}+
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-stone-500">
            Bathrooms
            <select
              value={searchParams.get('bathrooms') || ''}
              onChange={(event) => updateParams({ bathrooms: event.target.value })}
              className="focus-ring rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-sm text-stone-700"
            >
              <option value="">Any</option>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}+
                </option>
              ))}
            </select>
          </label>
          <label className="ml-auto flex items-center gap-2 text-xs font-bold text-stone-500">
            Sort
            <select
              value={searchParams.get('sort') || 'newest'}
              onChange={(event) => updateParams({ sort: event.target.value })}
              className="focus-ring rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-sm text-stone-700"
            >
              <option value="newest">Newest</option>
              <option value="priceAsc">Price: low to high</option>
              <option value="priceDesc">Price: high to low</option>
              <option value="topRated">Top rated</option>
            </select>
          </label>
          {hasFilters && (
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="focus-ring flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-extrabold text-red-700 hover:bg-red-50"
            >
              <RotateCcw size={14} /> Clear filters
            </button>
          )}
        </div>
      </section>

      {!isLoading && !isError && (
        <div className="mt-8 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-stone-500" aria-live="polite">
            {pagination?.totalItems
              ? 'Showing ' +
                firstResult +
                '–' +
                lastResult +
                ' of ' +
                pagination.totalItems +
                ' properties'
              : 'No properties found'}
          </p>
          {isFetching && (
            <span className="text-xs font-bold text-emerald-800">
              Updating results…
            </span>
          )}
        </div>
      )}

      {isLoading && (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <PropertyCardSkeleton key={index} />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <AlertTriangle className="mx-auto text-red-700" size={30} />
          <h2 className="mt-4 text-xl font-black text-stone-900">
            We could not load the properties
          </h2>
          <p className="mt-2 text-sm text-red-700">
            {getApiErrorMessage(error, 'Please check your connection and try again.')}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="focus-ring mt-5 cursor-pointer rounded-xl bg-emerald-950 px-5 py-3 text-sm font-black text-white"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && properties.length > 0 && (
        <div
          className={
            'mt-6 grid gap-6 transition-opacity md:grid-cols-2 xl:grid-cols-3 ' +
            (isFetching ? 'opacity-60' : 'opacity-100')
          }
        >
          {properties.map((property) => (
            <PropertyCard key={getPropertyId(property)} property={property} />
          ))}
        </div>
      )}

      {!isLoading && !isError && properties.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <h2 className="text-xl font-black text-stone-900">
            No matching properties yet
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            Try broadening the location, price, or property-type filters.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="focus-ring mt-5 cursor-pointer rounded-xl bg-emerald-950 px-5 py-3 text-sm font-black text-white"
            >
              View all properties
            </button>
          )}
        </div>
      )}

      {!isLoading && !isError && pagination?.totalPages > 1 && (
        <nav
          className="mt-10 flex items-center justify-center gap-3"
          aria-label="Property results pages"
        >
          <button
            type="button"
            disabled={!pagination.hasPreviousPage || isFetching}
            onClick={() => updateParams({ page: String(page - 1) }, false)}
            className="focus-ring flex cursor-pointer items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-extrabold text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={17} /> Previous
          </button>
          <span className="px-2 text-sm font-bold text-stone-500">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={!pagination.hasNextPage || isFetching}
            onClick={() => updateParams({ page: String(page + 1) }, false)}
            className="focus-ring flex cursor-pointer items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-extrabold text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next <ChevronRight size={17} />
          </button>
        </nav>
      )}
    </main>
  )
}

export default PropertiesPage
