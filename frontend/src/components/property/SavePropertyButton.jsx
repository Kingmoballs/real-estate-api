import { Heart, LoaderCircle } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import useAuth from '../../features/auth/useAuth.js'
import {
  useSavedStatus,
  useSetPropertySaved,
} from '../../features/savedProperties/savedPropertyApi.js'
import { getApiErrorMessage } from '../../lib/errors.js'

function SavePropertyButton({ propertyId }) {
  const { user } = useAuth()
  const location = useLocation()
  const { data, isLoading } = useSavedStatus(propertyId, Boolean(user))
  const mutation = useSetPropertySaved(propertyId)
  const isSaved = Boolean(data?.isSaved)

  if (!user) {
    return (
      <Link
        to="/login"
        state={{ from: location }}
        className="focus-ring mt-5 flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-black text-stone-700"
      >
        <Heart size={17} /> Sign in to save
      </Link>
    )
  }

  const handleToggle = async () => {
    try {
      await mutation.mutateAsync(!isSaved)
      toast.success(
        isSaved
          ? 'Property removed from your saved list'
          : 'Property saved to your account',
      )
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update saved property.'))
    }
  }

  return (
    <button
      type="button"
      disabled={isLoading || mutation.isPending}
      onClick={handleToggle}
      className="focus-ring mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-black text-stone-700 transition hover:border-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {mutation.isPending ? (
        <LoaderCircle size={17} className="animate-spin" />
      ) : (
        <Heart
          size={17}
          className={isSaved ? 'fill-red-500 text-red-500' : ''}
        />
      )}
      {isLoading ? 'Checking saved status…' : isSaved ? 'Saved' : 'Save property'}
    </button>
  )
}

export default SavePropertyButton
