import {
  AlertTriangle,
  BadgeCheck,
  LoaderCircle,
  MessageSquareText,
  Pencil,
  Star,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import ActivityPagination from '../activity/ActivityPagination.jsx'
import ConfirmAction from '../activity/ConfirmAction.jsx'
import PropertyImage from '../property/PropertyImage.jsx'
import {
  useDeleteReview,
  useMyReviews,
  useUpdateReview,
} from '../../features/reviews/reviewApi.js'
import { getPropertyId } from '../../features/properties/propertyFormatters.js'
import { getApiErrorMessage } from '../../lib/errors.js'

const formatReviewDate = (value) =>
  new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
  }).format(new Date(value))

function ReviewStars({ rating, size = 16 }) {
  const numericRating = Number(rating || 0)

  return (
    <span
      className="flex items-center gap-0.5 text-amber-500"
      aria-label={`${numericRating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={size}
          fill={
            index < numericRating
              ? 'currentColor'
              : 'none'
          }
        />
      ))}
    </span>
  )
}

function RatingInput({ value, onChange }) {
  return (
    <fieldset>
      <legend className="text-xs font-extrabold text-stone-600">
        Rating
      </legend>

      <div
        className="mt-2 flex gap-1"
        role="radiogroup"
        aria-label="Review rating"
      >
        {Array.from({ length: 5 }, (_, index) => {
          const rating = index + 1
          const selected = rating <= value

          return (
            <button
              key={rating}
              type="button"
              role="radio"
              aria-checked={value === rating}
              aria-label={`${rating} ${
                rating === 1
                  ? 'star'
                  : 'stars'
              }`}
              onClick={() =>
                onChange(rating)
              }
              className={
                'focus-ring cursor-pointer rounded-md p-1 transition ' +
                (selected
                  ? 'text-amber-500'
                  : 'text-stone-300 hover:text-amber-400')
              }
            >
              <Star
                size={25}
                fill={
                  selected
                    ? 'currentColor'
                    : 'none'
                }
              />
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function ReviewEditForm({
  review,
  isPending,
  onCancel,
  onSave,
}) {
  const [rating, setRating] = useState(
    review.rating,
  )
  const [title, setTitle] = useState(
    review.title || '',
  )
  const [comment, setComment] = useState(
    review.comment || '',
  )

  const trimmedComment = comment.trim()

  const canSave =
    rating >= 1 &&
    rating <= 5 &&
    trimmedComment.length >= 10 &&
    !isPending

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!canSave) return

    try {
      await onSave({
        rating,
        title: title.trim(),
        comment: trimmedComment,
      })
    } catch {
      // The parent displays the API error.
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
    >
      <RatingInput
        value={rating}
        onChange={setRating}
      />

      <label className="mt-4 block text-xs font-extrabold text-stone-600">
        Review title

        <input
          type="text"
          maxLength={120}
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          className="focus-ring mt-2 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm font-normal"
        />
      </label>

      <label className="mt-4 block text-xs font-extrabold text-stone-600">
        Review

        <textarea
          required
          minLength={10}
          maxLength={3000}
          rows={5}
          value={comment}
          onChange={(event) =>
            setComment(event.target.value)
          }
          className="focus-ring mt-2 w-full resize-y rounded-lg border border-stone-300 bg-white p-3 text-sm font-normal leading-6"
        />
      </label>

      <div className="mt-2 flex justify-between text-xs text-stone-500">
        <span>Minimum 10 characters</span>
        <span>{comment.length} / 3000</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!canSave}
          className="focus-ring flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-950 px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending && (
            <LoaderCircle
              size={15}
              className="animate-spin"
            />
          )}

          {isPending
            ? 'Saving…'
            : 'Save changes'}
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={onCancel}
          className="focus-ring cursor-pointer rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-xs font-black text-stone-600 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function MyReviewCard({
  review,
  isEditing,
  updateMutation,
  deleteMutation,
  onStartEditing,
  onStopEditing,
  onUpdate,
  onDelete,
}) {
  const property = review.property || {}
  const propertyId = getPropertyId(property)

  const isUpdating =
    updateMutation.isPending &&
    updateMutation.variables?.reviewId ===
      review._id

  const isDeleting =
    deleteMutation.isPending &&
    deleteMutation.variables === review._id

  return (
    <article className="grid gap-5 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-[170px_1fr] md:p-5">
      <PropertyImage
        property={property}
        className="aspect-[4/3] w-full rounded-xl md:aspect-square"
        sizes="170px"
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {propertyId ? (
              <Link
                to={
                  '/properties/' +
                  propertyId
                }
                className="focus-ring text-lg font-black text-stone-900 hover:text-emerald-800"
              >
                {property.title ||
                  'Reviewed property'}
              </Link>
            ) : (
              <h2 className="text-lg font-black text-stone-900">
                {property.title ||
                  'Reviewed property'}
              </h2>
            )}

            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
              <BadgeCheck size={14} />

              Verified through{' '}
              {review.verificationSource ===
              'booking'
                ? 'a completed stay'
                : 'a completed inspection'}
            </p>
          </div>

          <span
            className={
              'rounded-full px-3 py-1.5 text-xs font-extrabold ' +
              (review.status === 'hidden'
                ? 'bg-red-50 text-red-700'
                : 'bg-emerald-100 text-emerald-800')
            }
          >
            {review.status === 'hidden'
              ? 'Hidden'
              : 'Published'}
          </span>
        </div>

        {!isEditing && (
          <>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ReviewStars
                rating={review.rating}
              />

              <span className="text-xs font-semibold text-stone-400">
                Published{' '}
                {formatReviewDate(
                  review.createdAt,
                )}
              </span>

              {review.updatedAt !==
                review.createdAt && (
                <span className="text-xs font-semibold text-stone-400">
                  Edited{' '}
                  {formatReviewDate(
                    review.updatedAt,
                  )}
                </span>
              )}
            </div>

            {review.title && (
              <h3 className="mt-4 font-black text-stone-900">
                {review.title}
              </h3>
            )}

            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-stone-600">
              {review.comment}
            </p>

            {review.status === 'hidden' && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-black text-red-800">
                  This review is hidden from
                  the public
                </p>

                {review.moderationReason && (
                  <p className="mt-2 text-xs leading-5 text-red-700">
                    Reason:{' '}
                    {review.moderationReason}
                  </p>
                )}
              </div>
            )}

            {review.agentResponse?.comment && (
              <div className="mt-4 rounded-xl bg-emerald-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
                  Response from the agent
                </p>

                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {
                    review.agentResponse
                      .comment
                  }
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-start gap-2 border-t border-stone-100 pt-4">
              <button
                type="button"
                disabled={
                  updateMutation.isPending ||
                  deleteMutation.isPending
                }
                onClick={onStartEditing}
                className="focus-ring flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-extrabold text-emerald-900 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Pencil size={14} />
                Edit review
              </button>

              <ConfirmAction
                buttonLabel="Delete review"
                confirmLabel={
                  isDeleting
                    ? 'Deleting…'
                    : 'Delete permanently'
                }
                description="This permanently removes your review and updates the property’s public rating."
                tone="danger"
                isPending={isDeleting}
                onConfirm={onDelete}
              />
            </div>
          </>
        )}

        {isEditing && (
          <ReviewEditForm
            review={review}
            isPending={isUpdating}
            onCancel={onStopEditing}
            onSave={onUpdate}
          />
        )}
      </div>
    </article>
  )
}

function MyReviewsPanel({
  page,
  onPageChange,
}) {
  const {
    data,
    error,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useMyReviews({
    page,
    limit: 6,
  })

  const updateMutation =
    useUpdateReview()
  const deleteMutation =
    useDeleteReview()

  const [editingReviewId, setEditingReviewId] =
    useState(null)

  const reviews = data?.reviews || []

  const handleUpdate = async (
    reviewId,
    payload,
  ) => {
    try {
      await updateMutation.mutateAsync({
        reviewId,
        payload,
      })

      setEditingReviewId(null)
      toast.success('Review updated')
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to update the review.',
        ),
      )

      throw error
    }
  }

  const handleDelete = async (
    reviewId,
  ) => {
    try {
      await deleteMutation.mutateAsync(
        reviewId,
      )

      if (
        reviews.length === 1 &&
        page > 1
      ) {
        onPageChange(page - 1)
      }

      toast.success('Review deleted')
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to delete the review.',
        ),
      )

      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from(
          { length: 3 },
          (_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-2xl bg-stone-200"
            />
          ),
        )}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertTriangle
          className="mx-auto text-red-700"
          size={28}
        />

        <p className="mt-3 text-sm font-semibold text-red-700">
          {getApiErrorMessage(
            error,
            'Unable to load your reviews.',
          )}
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

  if (!reviews.length) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
        <MessageSquareText
          className="mx-auto text-stone-400"
          size={34}
        />

        <h2 className="mt-4 text-xl font-black text-stone-900">
          You have not written any reviews
        </h2>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-500">
          After completing a booking or
          inspection, return to the property
          page to leave a verified review.
        </p>
      </div>
    )
  }

  return (
    <>
      <div
        className={
          'space-y-5 transition-opacity ' +
          (isFetching
            ? 'opacity-60'
            : '')
        }
      >
        {reviews.map((review) => (
          <MyReviewCard
            key={review._id}
            review={review}
            isEditing={
              editingReviewId === review._id
            }
            updateMutation={
              updateMutation
            }
            deleteMutation={
              deleteMutation
            }
            onStartEditing={() =>
              setEditingReviewId(
                review._id,
              )
            }
            onStopEditing={() =>
              setEditingReviewId(null)
            }
            onUpdate={(payload) =>
              handleUpdate(
                review._id,
                payload,
              )
            }
            onDelete={() =>
              handleDelete(review._id)
            }
          />
        ))}
      </div>

      <ActivityPagination
        pagination={data?.pagination}
        isFetching={isFetching}
        onPageChange={onPageChange}
      />
    </>
  )
}

export default MyReviewsPanel