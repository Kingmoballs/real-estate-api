import { ExternalLink, MapPin } from 'lucide-react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import {
  getGeoapifyTileUrl,
  hasGeoapifyApiKey,
} from '../../features/maps/geoapify.js'
import propertyMarkerIcon from '../../features/maps/mapIcon.js'

const getCoordinates = (property) => {
  const coordinates = property?.geoLocation?.coordinates

  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return null
  }

  const longitude = Number(coordinates[0])
  const latitude = Number(coordinates[1])

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  return [latitude, longitude]
}

function PropertyLocationMap({
  property,
  locationLabel,
  className = 'mt-6',
}) {
  const position = getCoordinates(property)

  if (!position) return null

  const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${position[0]}&mlon=${position[1]}#map=17/${position[0]}/${position[1]}`

  return (
    <section
      className={`${className} overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm`}
    >
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <p className="eyebrow">Location</p>
          <h2 className="mt-1 text-xl font-black text-stone-900">
            Explore the neighbourhood
          </h2>
          <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-stone-500">
            <MapPin
              size={17}
              className="mt-1 shrink-0 text-amber-700"
            />
            {locationLabel}
          </p>
        </div>
        <a
          href={openStreetMapUrl}
          target="_blank"
          rel="noreferrer"
          className="focus-ring flex w-fit items-center gap-2 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-black text-stone-700 transition hover:border-emerald-800 hover:text-emerald-900"
        >
          Open larger map <ExternalLink size={15} />
        </a>
      </div>

      {hasGeoapifyApiKey ? (
        <MapContainer
          center={position}
          zoom={16}
          scrollWheelZoom={false}
          className="h-[16rem] w-full sm:h-[25rem]"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | <a href="https://www.geoapify.com/">Geoapify</a>'
            url={getGeoapifyTileUrl()}
          />
          <Marker position={position} icon={propertyMarkerIcon}>
            <Popup>
              <strong>{property.title}</strong>
              <br />
              {locationLabel}
            </Popup>
          </Marker>
        </MapContainer>
      ) : (
        <div className="border-t border-stone-200 bg-stone-50 px-5 py-6 text-sm leading-6 text-stone-600 sm:px-7 sm:py-8">
          The embedded map is unavailable, but you can open the property
          location using the link above.
        </div>
      )}
    </section>
  )
}

export default PropertyLocationMap
