import { Building2 } from 'lucide-react'
import { useState } from 'react'
import { getPrimaryPropertyImage } from '../../features/properties/propertyFormatters.js'

function PropertyImage({ property, className = '', imageClassName = '', sizes }) {
  const imageUrl = getPrimaryPropertyImage(property)
  const [imageFailed, setImageFailed] = useState(false)

  if (!imageUrl || imageFailed) {
    return (
      <div
        role="img"
        aria-label={property.title + ' has no available image'}
        className={
          'grid place-items-center overflow-hidden bg-stone-200 text-stone-400 ' +
          className
        }
      >
        <Building2 size={42} strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={property.title}
      className={'object-cover ' + className + ' ' + imageClassName}
      sizes={sizes}
      onError={() => setImageFailed(true)}
    />
  )
}

export default PropertyImage
