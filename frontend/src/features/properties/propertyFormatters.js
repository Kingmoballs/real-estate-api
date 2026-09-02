const titleCase = (value = '') =>
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

export const getPropertyId = (property) => property?._id || property?.id

export const getPropertyLocation = (property) => {
  if (property?.location) return property.location

  const address = property?.address || {}
  return [address.city, address.state, address.country]
    .filter(Boolean)
    .join(', ')
}

export const getPrimaryPropertyImage = (property) =>
  property?.images?.find((image) => image?.url)?.url || null

export const formatPropertyPrice = (property) => {
  const currency = property?.currency || 'NGN'
  const formattedPrice = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(property?.price || 0))

  return property?.pricePeriod === 'total'
    ? formattedPrice
    : formattedPrice + ' / ' + (property?.pricePeriod || 'period')
}

export const formatPropertyType = (value) => titleCase(value || 'property')
export const formatAmenity = (value) => titleCase(value)

export const formatPropertySize = (property) => {
  if (!property?.size?.value) return null
  return (
    new Intl.NumberFormat('en-NG').format(property.size.value) +
    ' ' +
    (property.size.unit || 'sqm')
  )
}
