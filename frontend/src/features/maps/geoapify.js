const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v1/geocode'

export const geoapifyApiKey =
  import.meta.env.VITE_GEOAPIFY_API_KEY?.trim() || ''

export const hasGeoapifyApiKey = Boolean(geoapifyApiKey)

export const getGeoapifyTileUrl = () =>
  `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${encodeURIComponent(
    geoapifyApiKey,
  )}`

const requestGeoapify = async (path, params, signal) => {
  if (!hasGeoapifyApiKey) {
    throw new Error('Geoapify API key is not configured')
  }

  const searchParams = new URLSearchParams({
    ...params,
    format: 'json',
    lang: 'en',
    apiKey: geoapifyApiKey,
  })
  const response = await fetch(
    `${GEOAPIFY_BASE_URL}/${path}?${searchParams.toString()}`,
    { signal },
  )

  if (!response.ok) {
    throw new Error(`Location service returned ${response.status}`)
  }

  return response.json()
}

const firstValue = (...values) =>
  values.find(
    (value) => typeof value === 'string' && value.trim().length > 0,
  ) || ''

export const normalizeGeoapifyResult = (result = {}) => {
  const latitude = Number(result.lat)
  const longitude = Number(result.lon)
  const streetAddress = firstValue(
    result.address_line1,
    [result.housenumber, result.street].filter(Boolean).join(' '),
    result.name,
  )

  return {
    location: firstValue(result.formatted, result.address_line2, streetAddress),
    streetAddress,
    city: firstValue(
      result.city,
      result.town,
      result.village,
      result.municipality,
      result.county,
    ),
    state: firstValue(result.state, result.state_code),
    lga: firstValue(result.county, result.district, result.suburb),
    country: firstValue(result.country, 'Nigeria'),
    postalCode: firstValue(result.postcode),
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
  }
}

export const searchNigerianAddresses = async (query, signal) => {
  const data = await requestGeoapify(
    'autocomplete',
    {
      text: query.trim(),
      filter: 'countrycode:ng',
      bias: 'countrycode:ng',
      limit: '6',
    },
    signal,
  )

  return (data.results || []).map(normalizeGeoapifyResult)
}

export const reverseGeocodeLocation = async (
  latitude,
  longitude,
  signal,
) => {
  const data = await requestGeoapify(
    'reverse',
    {
      lat: String(latitude),
      lon: String(longitude),
      limit: '1',
    },
    signal,
  )
  const result = data.results?.[0]

  if (!result) {
    return { latitude, longitude }
  }

  return {
    ...normalizeGeoapifyResult(result),
    latitude,
    longitude,
  }
}
