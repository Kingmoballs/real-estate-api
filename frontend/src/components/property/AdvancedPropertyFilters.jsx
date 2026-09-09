import {
  LocateFixed,
  LoaderCircle,
  MapPin,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useState } from 'react'

const amenityOptions = [
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

const advancedFilterKeys = [
  'amenities',
  'furnishingStatus',
  'sizeUnit',
  'minSize',
  'maxSize',
  'parkingSpaces',
  'minRating',
  'latitude',
  'longitude',
  'radiusKm',
]

const inputClass =
  'focus-ring h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-700'

const getLocationErrorMessage = (error) => {
  if (error?.code === 1) {
    return 'Location permission was denied. Allow location access in your browser and try again.'
  }

  if (error?.code === 2) {
    return 'Your current location could not be determined.'
  }

  if (error?.code === 3) {
    return 'Finding your location took too long. Please try again.'
  }

  return 'Unable to access your current location.'
}

function AdvancedPropertyFilters({
  searchParams,
  updateParams,
}) {
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState('')

  const latitude = searchParams.get('latitude')
  const longitude = searchParams.get('longitude')
  const radiusKm = searchParams.get('radiusKm') || '10'
  const hasCoordinates = Boolean(latitude && longitude)

  const selectedAmenities = new Set(
    (searchParams.get('amenities') || '')
      .split(',')
      .filter(Boolean),
  )

  const hasAdvancedFilters = advancedFilterKeys.some((key) =>
    searchParams.has(key),
  )

  const handleUseCurrentLocation = () => {
    setLocationError('')

    if (!navigator.geolocation) {
      setLocationError(
        'Location search is not supported by this browser.',
      )
      return
    }

    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setIsLocating(false)

        updateParams({
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
          radiusKm,
        })
      },
      (error) => {
        setIsLocating(false)
        setLocationError(getLocationErrorMessage(error))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    )
  }

  const clearLocation = () => {
    setLocationError('')

    updateParams({
      latitude: '',
      longitude: '',
      radiusKm: '',
    })
  }

  return (
    <details
      open={hasAdvancedFilters || undefined}
      className="col-span-2 md:col-span-2 xl:col-span-5"
    >
      <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 rounded-xl py-2 text-sm font-black text-emerald-950">
        <SlidersHorizontal size={17} />
        Advanced filters
      </summary>

      <div className="mt-4 grid gap-5 border-t border-stone-100 pt-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label>
            <span className="mb-1.5 block text-xs font-bold text-stone-500">
              Furnishing
            </span>

            <select
              name="furnishingStatus"
              defaultValue={
                searchParams.get('furnishingStatus') || ''
              }
              className={inputClass}
            >
              <option value="">Any furnishing</option>
              <option value="unfurnished">Unfurnished</option>
              <option value="semiFurnished">
                Semi-furnished
              </option>
              <option value="furnished">Furnished</option>
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-bold text-stone-500">
              Minimum size
            </span>

            <input
              name="minSize"
              type="number"
              min="0"
              step="any"
              defaultValue={searchParams.get('minSize') || ''}
              placeholder="Minimum size"
              className={inputClass}
            />
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-bold text-stone-500">
              Maximum size
            </span>

            <input
              name="maxSize"
              type="number"
              min="0"
              step="any"
              defaultValue={searchParams.get('maxSize') || ''}
              placeholder="Maximum size"
              className={inputClass}
            />
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-bold text-stone-500">
              Size unit
            </span>

            <select
              name="sizeUnit"
              defaultValue={searchParams.get('sizeUnit') || ''}
              className={inputClass}
            >
              <option value="">Any unit</option>
              <option value="sqm">Square metres</option>
              <option value="sqft">Square feet</option>
              <option value="acre">Acres</option>
              <option value="hectare">Hectares</option>
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-bold text-stone-500">
              Minimum parking spaces
            </span>

            <select
              name="parkingSpaces"
              defaultValue={
                searchParams.get('parkingSpaces') || ''
              }
              className={inputClass}
            >
              <option value="">Any</option>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}+
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-bold text-stone-500">
              Minimum rating
            </span>

            <select
              name="minRating"
              defaultValue={searchParams.get('minRating') || ''}
              className={inputClass}
            >
              <option value="">Any rating</option>
              <option value="3">3 stars and above</option>
              <option value="4">4 stars and above</option>
              <option value="4.5">4.5 stars and above</option>
            </select>
          </label>
        </div>

        <fieldset>
          <legend className="text-sm font-black text-stone-800">
            Required amenities
          </legend>

          <p className="mt-1 text-xs text-stone-500">
            Properties must contain every selected amenity.
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {amenityOptions.map(([value, label]) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 px-3 py-2.5 text-xs font-bold text-stone-600 transition hover:bg-stone-50"
              >
                <input
                  name="amenities"
                  type="checkbox"
                  value={value}
                  defaultChecked={selectedAmenities.has(value)}
                  className="size-4 accent-emerald-900"
                />

                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-900 text-white">
              <MapPin size={18} />
            </span>

            <div>
              <h3 className="font-black text-emerald-950">
                Search near me
              </h3>

              <p className="mt-1 text-xs leading-5 text-emerald-900/70">
                Allow location access to find properties within a
                selected distance of your current position.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="min-w-44">
              <span className="mb-1.5 block text-xs font-bold text-stone-600">
                Search radius
              </span>

              <select
                value={hasCoordinates ? radiusKm : ''}
                disabled={!hasCoordinates}
                onChange={(event) =>
                  updateParams({
                    radiusKm: event.target.value,
                  })
                }
                className={inputClass}
              >
                <option value="">Select location first</option>
                <option value="2">Within 2 km</option>
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="25">Within 25 km</option>
                <option value="50">Within 50 km</option>
              </select>
            </label>

            <button
              type="button"
              disabled={isLocating}
              onClick={handleUseCurrentLocation}
              className="focus-ring flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-emerald-950 px-4 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60"
            >
              {isLocating ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <LocateFixed size={17} />
              )}

              {isLocating
                ? 'Finding location…'
                : hasCoordinates
                  ? 'Update my location'
                  : 'Use my location'}
            </button>

            {hasCoordinates && (
              <button
                type="button"
                onClick={clearLocation}
                className="focus-ring flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-black text-stone-700"
              >
                <X size={16} />
                Clear location
              </button>
            )}
          </div>

          {hasCoordinates && (
            <p className="mt-3 text-xs font-bold text-emerald-900">
              Showing properties within {radiusKm} km of your
              selected location.
            </p>
          )}

          {locationError && (
            <p
              className="mt-3 text-xs font-bold text-red-700"
              role="alert"
            >
              {locationError}
            </p>
          )}

          <p className="mt-3 text-[11px] leading-5 text-stone-500">
            Your position is used for this property search and is
            not saved to your account. Location access requires
            HTTPS or localhost.
          </p>
        </section>
      </div>
    </details>
  )
}

export default AdvancedPropertyFilters
