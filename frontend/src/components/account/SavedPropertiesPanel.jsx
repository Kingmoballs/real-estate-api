import { AlertTriangle, BookmarkX, LoaderCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import ActivityPagination from '../activity/ActivityPagination.jsx'
import PropertyCard from '../property/PropertyCard.jsx'
import PropertyCardSkeleton from '../property/PropertyCardSkeleton.jsx'
import { getPropertyId } from '../../features/properties/propertyFormatters.js'
import {
  useSavedProperties,
  useSetPropertySaved,
} from '../../features/savedProperties/savedPropertyApi.js'
import { getApiErrorMessage } from '../../lib/errors.js'

function SavedPropertyItem({ property }) {
  const propertyId = getPropertyId(property)
  const mutation = useSetPropertySaved(propertyId)

  const handleRemove = async () => {
    try {
      await mutation.mutateAsync(false)
      toast.success('Property removed from your saved list')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to remove property.'))
    }
  }

  return (
    <div>
      <PropertyCard property={property} />
      <button
        type="button"
        disabled={mutation.isPending}
        onClick={handleRemove}
        className="focus-ring mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {mutation.isPending ? (
          <LoaderCircle size={15} className="animate-spin" />
        ) : (
          <Trash2 size={15} />
        )}
        Remove from saved
      </button>
    </div>
  )
}

function SavedPropertiesPanel({ page, onPageChange }) {
  const { data, error, isError, isFetching, isLoading, refetch } =
    useSavedProperties({ page, limit: 6 })
  const savedProperties = data?.savedProperties || []

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <PropertyCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertTriangle className="mx-auto text-red-700" size={28} />
        <p className="mt-3 text-sm font-semibold text-red-700">
          {getApiErrorMessage(error, 'Unable to load saved properties.')}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="focus-ring mt-4 cursor-pointer rounded-lg bg-emerald-950 px-4 py-2 text-xs font-black text-white"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!savedProperties.length) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
        <BookmarkX className="mx-auto text-stone-400" size={32} />
        <h2 className="mt-4 text-xl font-black text-stone-900">
          No saved properties yet
        </h2>
        <p className="mt-2 text-sm text-stone-500">
          Save a published property from its details page to compare it later.
        </p>
      </div>
    )
  }

  return (
    <>
      <div
        className={
          'grid gap-6 transition-opacity md:grid-cols-2 xl:grid-cols-3 ' +
          (isFetching ? 'opacity-60' : '')
        }
      >
        {savedProperties.map((savedProperty) => (
          <SavedPropertyItem
            key={savedProperty._id}
            property={savedProperty.property}
          />
        ))}
      </div>
      <ActivityPagination
        pagination={data.pagination}
        isFetching={isFetching}
        onPageChange={onPageChange}
      />
    </>
  )
}

export default SavedPropertiesPanel
