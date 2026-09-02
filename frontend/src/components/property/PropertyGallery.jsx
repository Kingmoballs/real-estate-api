import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Expand,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function normalizeIndex(index, imageCount) {
  if (imageCount === 0) return 0

  return (index + imageCount) % imageCount
}

function PropertyGallery({ property }) {
  const images =
    property.images?.filter((image) => image?.url) || []

  const trackRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const hasMultipleImages = images.length > 1

  const goToSlide = (index) => {
    const nextIndex = normalizeIndex(index, images.length)
    const track = trackRef.current

    setActiveIndex(nextIndex)

    if (track) {
      track.scrollTo({
        left: track.clientWidth * nextIndex,
        behavior: 'smooth',
      })
    }
  }

  const handleScroll = (event) => {
    const track = event.currentTarget

    if (!track.clientWidth) return

    const nextIndex = Math.round(
      track.scrollLeft / track.clientWidth,
    )

    if (
      nextIndex >= 0 &&
      nextIndex < images.length &&
      nextIndex !== activeIndex
    ) {
      setActiveIndex(nextIndex)
    }
  }

  const openLightbox = (index) => {
    setLightboxIndex(normalizeIndex(index, images.length))
  }

  const closeLightbox = () => {
    setLightboxIndex(null)
  }

  const showPreviousLightboxImage = () => {
    setLightboxIndex((currentIndex) =>
      normalizeIndex((currentIndex ?? 0) - 1, images.length),
    )
  }

  const showNextLightboxImage = () => {
    setLightboxIndex((currentIndex) =>
      normalizeIndex((currentIndex ?? 0) + 1, images.length),
    )
  }

  useEffect(() => {
    if (lightboxIndex === null) return undefined

    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setLightboxIndex(null)
      }

      if (event.key === 'ArrowLeft' && images.length > 1) {
        setLightboxIndex((currentIndex) =>
          normalizeIndex((currentIndex ?? 0) - 1, images.length),
        )
      }

      if (event.key === 'ArrowRight' && images.length > 1) {
        setLightboxIndex((currentIndex) =>
          normalizeIndex((currentIndex ?? 0) + 1, images.length),
        )
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [lightboxIndex, images.length])

  if (images.length === 0) {
    return (
      <div
        role="img"
        aria-label={property.title + ' has no available images'}
        className="grid aspect-[4/3] w-full place-items-center rounded-[2rem] bg-stone-200 text-stone-400 sm:aspect-[16/9]"
      >
        <div className="text-center">
          <Building2 className="mx-auto" size={48} strokeWidth={1.5} />

          <p className="mt-3 text-sm font-bold">
            No property images available
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <section aria-label="Property image gallery">
        <div className="group relative overflow-hidden rounded-[1.5rem] bg-stone-950 sm:rounded-[2rem]">
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((image, index) => (
              <div
                key={image.public_id || image.url}
                className="relative aspect-[4/3] w-full shrink-0 snap-center sm:aspect-[16/9] lg:aspect-[16/7]"
              >
                <button
                  type="button"
                  onClick={() => openLightbox(index)}
                  className="focus-ring h-full w-full cursor-zoom-in"
                  aria-label={
                    'Expand image ' +
                    (index + 1) +
                    ' of ' +
                    images.length
                  }
                >
                  <img
                    src={image.url}
                    alt={
                      property.title +
                      ' image ' +
                      (index + 1)
                    }
                    loading={index === 0 ? 'eager' : 'lazy'}
                    className="h-full w-full object-cover"
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/50 to-transparent p-4 text-white">
            <span
              aria-live="polite"
              className="rounded-full bg-black/55 px-3 py-1.5 text-xs font-extrabold backdrop-blur"
            >
              {activeIndex + 1} / {images.length}
            </span>

            <button
              type="button"
              onClick={() => openLightbox(activeIndex)}
              className="focus-ring pointer-events-auto grid size-10 cursor-pointer place-items-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/75"
              aria-label="Open full-screen gallery"
            >
              <Expand size={18} />
            </button>
          </div>

          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={() => goToSlide(activeIndex - 1)}
                className="focus-ring absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75 sm:grid"
                aria-label="Show previous property image"
              >
                <ChevronLeft size={23} />
              </button>

              <button
                type="button"
                onClick={() => goToSlide(activeIndex + 1)}
                className="focus-ring absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75 sm:grid"
                aria-label="Show next property image"
              >
                <ChevronRight size={23} />
              </button>
            </>
          )}
        </div>

        {hasMultipleImages && (
          <>
            <div
              className="mt-3 flex justify-center gap-1.5 sm:hidden"
              aria-label="Gallery position"
            >
              {images.map((image, index) => (
                <button
                  key={image.public_id || image.url}
                  type="button"
                  onClick={() => goToSlide(index)}
                  aria-label={'Show property image ' + (index + 1)}
                  className={
                    'focus-ring h-2 rounded-full transition-all ' +
                    (activeIndex === index
                      ? 'w-7 bg-emerald-900'
                      : 'w-2 bg-stone-300')
                  }
                />
              ))}
            </div>

            <div className="mt-4 hidden gap-3 overflow-x-auto pb-2 sm:flex">
              {images.map((image, index) => (
                <button
                  key={image.public_id || image.url}
                  type="button"
                  onClick={() => goToSlide(index)}
                  aria-label={'Show property image ' + (index + 1)}
                  aria-current={activeIndex === index ? 'true' : undefined}
                  className={
                    'focus-ring relative h-20 w-28 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 bg-stone-200 transition ' +
                    (activeIndex === index
                      ? 'border-emerald-900 opacity-100'
                      : 'border-transparent opacity-65 hover:opacity-100')
                  }
                >
                  <img
                    src={image.url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Full-screen property image gallery"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeLightbox()
            }
          }}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/95 px-3 py-5 sm:px-8"
        >
          <button
            type="button"
            autoFocus
            onClick={closeLightbox}
            className="focus-ring absolute right-4 top-4 z-10 grid size-11 cursor-pointer place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
            aria-label="Close full-screen gallery"
          >
            <X size={22} />
          </button>

          <div className="absolute left-4 top-4 rounded-full bg-white/15 px-3 py-1.5 text-xs font-extrabold text-white backdrop-blur">
            {lightboxIndex + 1} / {images.length}
          </div>

          <img
            src={images[lightboxIndex].url}
            alt={
              property.title +
              ' enlarged image ' +
              (lightboxIndex + 1)
            }
            className="max-h-[82vh] max-w-[94vw] select-none object-contain"
            style={{ touchAction: 'pinch-zoom' }}
          />

          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={showPreviousLightboxImage}
                className="focus-ring absolute left-3 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 sm:left-6 sm:size-13"
                aria-label="Show previous enlarged image"
              >
                <ChevronLeft size={26} />
              </button>

              <button
                type="button"
                onClick={showNextLightboxImage}
                className="focus-ring absolute right-3 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 sm:right-6 sm:size-13"
                aria-label="Show next enlarged image"
              >
                <ChevronRight size={26} />
              </button>
            </>
          )}

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-xs font-semibold text-white/70 sm:hidden">
            Swipe the gallery or use the arrows
          </p>
        </div>
      )}
    </>
  )
}

export default PropertyGallery
