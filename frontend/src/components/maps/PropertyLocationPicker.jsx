import { LoaderCircle, MapPin, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import {
  getGeoapifyTileUrl,
  hasGeoapifyApiKey,
  reverseGeocodeLocation,
  searchNigerianAddresses,
} from '../../features/maps/geoapify.js'
import propertyMarkerIcon from '../../features/maps/mapIcon.js'

const LAGOS_CENTER = [6.5244, 3.3792]

const hasCoordinateValue = (value) =>
  value !== undefined &&
  value !== null &&
  value !== '' &&
  Number.isFinite(Number(value))

function MapViewport({ position, hasSelection }) {
  const map = useMap()

  useEffect(() => {
    map.setView(position, hasSelection ? 16 : 11)
  }, [hasSelection, map, position])

  return null
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      void onPick(event.latlng.lat, event.latlng.lng)
    },
  })

  return null
}

function PropertyLocationPicker({
  latitude,
  longitude,
  onLocationChange,
}) {
  const [query, setQuery] = useState('')
  const [selectedLabel, setSelectedLabel] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searchStatus, setSearchStatus] = useState('idle')
  const [mapError, setMapError] = useState('')
  const [isResolvingPin, setIsResolvingPin] = useState(false)
  const reverseRequestRef = useRef(null)

  const hasSelection =
    hasCoordinateValue(latitude) && hasCoordinateValue(longitude)
  const position = hasSelection
    ? [Number(latitude), Number(longitude)]
    : LAGOS_CENTER

  useEffect(() => {
    const searchText = query.trim()

    if (
      !hasGeoapifyApiKey ||
      searchText.length < 3 ||
      searchText === selectedLabel
    ) {
      return undefined
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setSearchStatus('loading')

      try {
        const results = await searchNigerianAddresses(
          searchText,
          controller.signal,
        )
        setSuggestions(results)
        setSearchStatus('success')
      } catch (error) {
        if (error.name !== 'AbortError') {
          setSuggestions([])
          setSearchStatus('error')
        }
      }
    }, 400)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [query, selectedLabel])

  useEffect(
    () => () => {
      reverseRequestRef.current?.abort()
    },
    [],
  )

  const selectSuggestion = (suggestion) => {
    setSelectedLabel(suggestion.location)
    setQuery(suggestion.location)
    setSuggestions([])
    setSearchStatus('idle')
    setMapError('')
    onLocationChange(suggestion)
  }

  const resolvePin = async (nextLatitude, nextLongitude) => {
    reverseRequestRef.current?.abort()

    const controller = new AbortController()
    reverseRequestRef.current = controller

    setMapError('')
    setIsResolvingPin(true)
    onLocationChange({
      latitude: nextLatitude,
      longitude: nextLongitude,
    })

    try {
      const location = await reverseGeocodeLocation(
        nextLatitude,
        nextLongitude,
        controller.signal,
      )

      onLocationChange(location)

      if (location.location) {
        setSelectedLabel(location.location)
        setQuery(location.location)
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setMapError(
          'The pin was saved, but the address could not be detected. Enter the address fields manually.',
        )
      }
    } finally {
      if (reverseRequestRef.current === controller) {
        reverseRequestRef.current = null
        setIsResolvingPin(false)
      }
    }
  }

  if (!hasGeoapifyApiKey) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"
      >
        <p className="font-black">Location map is not configured</p>
        <p className="mt-1">
          Add <code>VITE_GEOAPIFY_API_KEY</code> to the frontend
          environment file, then restart the development server. You can
          still complete the address fields manually.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <label
          htmlFor="property-address-search"
          className="block text-sm font-extrabold text-stone-700"
        >
          Find the property on the map
        </label>
        <div className="relative mt-2">
          <Search
            aria-hidden="true"
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-stone-400"
          />
          <input
            id="property-address-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setSelectedLabel('')
              setSuggestions([])
              setSearchStatus('idle')
            }}
            placeholder="Search an address or landmark in Nigeria"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={suggestions.length > 0}
            aria-controls="property-address-suggestions"
            className="focus-ring h-12 w-full rounded-xl border border-stone-300 bg-white pl-11 pr-11 text-sm"
          />
          {searchStatus === 'loading' && (
            <LoaderCircle
              aria-label="Searching addresses"
              size={18}
              className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-emerald-800"
            />
          )}
        </div>

        {suggestions.length > 0 && (
          <ul
            id="property-address-suggestions"
            role="listbox"
            className="absolute z-[1001] mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-stone-200 bg-white p-1.5 shadow-2xl"
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.latitude}-${suggestion.longitude}-${index}`}
                role="option"
                aria-selected="false"
              >
                <button
                  type="button"
                  onClick={() => selectSuggestion(suggestion)}
                  className="focus-ring flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-emerald-50"
                >
                  <MapPin
                    size={17}
                    className="mt-0.5 shrink-0 text-emerald-800"
                  />
                  <span>
                    <span className="block text-sm font-bold text-stone-800">
                      {suggestion.streetAddress || suggestion.location}
                    </span>
                    {suggestion.streetAddress && (
                      <span className="mt-0.5 block text-xs leading-5 text-stone-500">
                        {suggestion.location}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {searchStatus === 'success' && suggestions.length === 0 && (
          <p className="mt-2 text-xs font-semibold text-stone-500">
            No matching Nigerian address was found. Try a nearby landmark or
            click the location directly on the map.
          </p>
        )}

        {searchStatus === 'error' && (
          <p className="mt-2 text-xs font-semibold text-red-700">
            Address search is temporarily unavailable. You can select the
            location directly on the map.
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
        <MapContainer
          center={position}
          zoom={hasSelection ? 16 : 11}
          scrollWheelZoom={false}
          className="h-[22rem] w-full sm:h-[26rem]"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | <a href="https://www.geoapify.com/">Geoapify</a>'
            url={getGeoapifyTileUrl()}
            eventHandlers={{
              tileerror: () =>
                setMapError(
                  'The map tiles could not be loaded. Check the Geoapify key and its website restrictions.',
                ),
            }}
          />
          <MapViewport
            position={position}
            hasSelection={hasSelection}
          />
          <MapClickHandler onPick={resolvePin} />
          {hasSelection && (
            <Marker
              position={position}
              icon={propertyMarkerIcon}
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const nextPosition = event.target.getLatLng()
                  void resolvePin(nextPosition.lat, nextPosition.lng)
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
        {isResolvingPin ? (
          <LoaderCircle
            size={18}
            className="mt-0.5 shrink-0 animate-spin text-emerald-800"
          />
        ) : (
          <MapPin
            size={18}
            className="mt-0.5 shrink-0 text-emerald-800"
          />
        )}
        <p className="leading-6">
          {hasSelection
            ? 'The location pin is selected. Drag it or click elsewhere on the map to make it more precise.'
            : 'Search above or click the map to place the property pin.'}
        </p>
      </div>

      {mapError && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {mapError}
        </p>
      )}
    </div>
  )
}

export default PropertyLocationPicker
