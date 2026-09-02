import {
  AlertTriangle,
  BadgeCheck,
  LoaderCircle,
  MessageSquareText,
  Star,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import ActivityPagination from '../activity/ActivityPagination.jsx'
import useAuth from '../../features/auth/useAuth.js'
import {
  useCreateReview,
  usePropertyReviews,
  useReviewEligibility,
} from '../../features/reviews/reviewApi.js'
import { getApiErrorMessage } from '../../lib/errors.js'

const reviewSortOptions = [
  ['newest', 'Newest'],
  ['oldest', 'Oldest'],
  ['highest', 'Highest rated'],
  ['lowest', 'Lowest rated'],
]

const ratingFilterOptions = [
  ['', 'All ratings'],
  ['5', '5 stars'],
  ['4', '4 stars'],
  ['3', '3 stars'],
  ['2', '2 stars'],
  ['1', '1 star'],
]

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
            index < Math.round(numericRating)
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
        Your rating
      </legend>

      <div
        className="mt-2 flex gap-1"
        role="radiogroup"
        aria-label="Property rating"
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
                rating === 1 ? 'star' : 'stars'
              }`}
              onClick={() => onChange(rating)}
              className={
                'focus-ring cursor-pointer rounded-md p-1 transition ' +
                (selected
                  ? 'text-amber-500'
                  : 'text-stone-300 hover:text-amber-400')
              }
            >
              <Star
                size={27}
                fill={selected ? 'currentColor' : 'none'}
              />
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function ReviewForm({ propertyId, onCreated }) {
  const mutation = useCreateReview(propertyId)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')

  const trimmedComment = comment.trim()
  const canSubmit =
    rating >= 1 &&
    rating <= 5 &&
    trimmedComment.length >= 10 &&
    !mutation.isPending

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!canSubmit) return

    try {
      await mutation.mutateAsync({
        property: propertyId,
        rating,
        title: title.trim(),
        comment: trimmedComment,
      })

      setRating(0)
      setTitle('')
      setComment('')
      onCreated()
      toast.success('Your review has been published')
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to publish your review.',
        ),
      )
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-6"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-900 text-white">
          <MessageSquareText size={19} />
        </span>

        <div>
          <h3 className="text-lg font-black text-stone-900">
            Share your experience
          </h3>

          <p className="mt-1 text-xs leading-5 text-stone-600">
            Your completed booking or inspection has been
            verified, so you can review this property.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <RatingInput
          value={rating}
          onChange={setRating}
        />
      </div>

      <label className="mt-5 block text-xs font-extrabold text-stone-600">
        Review title
        <input
          type="text"
          maxLength={120}
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="Summarise your experience"
          className="focus-ring mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm font-normal"
        />
      </label>

      <label className="mt-4 block text-xs font-extrabold text-stone-600">
        Your review
        <textarea
          required
          minLength={10}
          maxLength={3000}
          rows={5}
          value={comment}
          onChange={(event) =>
            setComment(event.target.value)
          }
          placeholder="Describe the property and your experience. Use at least 10 characters."
          className="focus-ring mt-2 w-full resize-y rounded-xl border border-stone-300 bg-white p-4 text-sm font-normal leading-6"
        />
      </label>

      <div className="mt-2 flex justify-between gap-4 text-xs text-stone-500">
        <span>
          Minimum 10 characters
        </span>

        <span>
          {comment.length} / 3000
        </span>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="focus-ring mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mutation.isPending && (
          <LoaderCircle
            size={17}
            className="animate-spin"
          />
        )}

        {mutation.isPending
          ? 'Publishing review…'
          : 'Publish review'}
      </button>
    </form>
  )
}

function ReviewAccess({
  propertyId,
  onReviewCreated,
}) {
  const { user } = useAuth()
  const location = useLocation()

  const {
    data: eligibility,
    error,
    isError,
    isLoading,
  } = useReviewEligibility(
    propertyId,
    user?.role === 'user',
  )

  if (!user) {
    return (
      <div className="rounded-[1.6rem] border border-stone-200 bg-stone-50 p-6">
        <h3 className="font-black text-stone-900">
          Have you experienced this property?
        </h3>

        <p className="mt-2 text-sm leading-6 text-stone-600">
          Sign in to check whether your completed booking or
          inspection qualifies for a verified review.
        </p>

        <Link
          to="/login"
          state={{ from: location }}
          className="focus-ring mt-4 inline-block rounded-xl bg-emerald-950 px-5 py-3 text-sm font-black text-white"
        >
          Sign in to review
        </Link>
      </div>
    )
  }

  if (user.role !== 'user') {
    return null
  }

  if (isLoading) {
    return (
      <div className="h-36 animate-pulse rounded-[1.6rem] bg-stone-200" />
    )
  }

  if (isError) {
    return (
      <div className="rounded-[1.6rem] border border-red-200 bg-red-50 p-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
          <AlertTriangle size={18} />
          {getApiErrorMessage(
            error,
            'Unable to check review eligibility.',
          )}
        </p>
      </div>
    )
  }

  if (eligibility?.eligible) {
    return (
      <ReviewForm
        propertyId={propertyId}
        onCreated={onReviewCreated}
      />
    )
  }

  return (
    <div className="rounded-[1.6rem] border border-stone-200 bg-stone-50 p-6">
      <p className="flex items-center gap-2 text-sm font-black text-stone-800">
        <BadgeCheck
          size={18}
          className="text-stone-500"
        />
        Verified reviews only
      </p>

      <p className="mt-2 text-sm leading-6 text-stone-600">
        {eligibility?.reason ||
          'Complete an eligible booking or inspection before reviewing this property.'}
      </p>
    </div>
  )
}

function ReviewCard({ review }) {
  const customerName =
    review.customer?.name || 'Verified customer'

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black text-stone-900">
            {customerName}
          </p>

          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <BadgeCheck size={14} />
            Verified through{' '}
            {review.verificationSource === 'booking'
              ? 'a completed stay'
              : 'a completed inspection'}
          </p>
        </div>

        <div className="text-right">
          <ReviewStars rating={review.rating} />

          <p className="mt-1 text-xs text-stone-400">
            {formatReviewDate(review.createdAt)}
          </p>
        </div>
      </div>

      {review.title && (
        <h3 className="mt-5 text-base font-black text-stone-900">
          {review.title}
        </h3>
      )}

      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-stone-600">
        {review.comment}
      </p>

      {review.agentResponse?.comment && (
        <div className="mt-5 rounded-xl bg-emerald-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
            Response from the agent
          </p>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            {review.agentResponse.comment}
          </p>

          {review.agentResponse.respondedBy?.name && (
            <p className="mt-2 text-xs font-bold text-stone-500">
              {review.agentResponse.respondedBy.name}
            </p>
          )}
        </div>
      )}
    </article>
  )
}

function PropertyReviews({ propertyId }) {
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('newest')
  const [ratingFilter, setRatingFilter] =
    useState('')

  const {
    data,
    error,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = usePropertyReviews(propertyId, {
    page,
    limit: 6,
    sort,
    rating: ratingFilter,
  })

  const reviews = data?.reviews || []
  const summary = data?.property

  const resetToNewestReviews = () => {
    setPage(1)
    setSort('newest')
    setRatingFilter('')
  }

  return (
    <section
      id="reviews"
      className="mt-10 scroll-mt-24"
      aria-labelledby="reviews-heading"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">
                Verified experiences
              </p>

              <h2
                id="reviews-heading"
                className="mt-2 text-3xl font-black tracking-[-0.045em] text-stone-900"
              >
                Property reviews
              </h2>

              {summary?.reviewCount > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ReviewStars
                    rating={summary.ratingAverage}
                    size={18}
                  />

                  <span className="text-sm font-black text-stone-800">
                    {Number(
                      summary.ratingAverage || 0,
                    ).toFixed(1)}
                  </span>

                  <span className="text-sm text-stone-500">
                    from {summary.reviewCount}{' '}
                    {summary.reviewCount === 1
                      ? 'review'
                      : 'reviews'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="text-xs font-extrabold text-stone-500">
                Rating
                <select
                  value={ratingFilter}
                  onChange={(event) => {
                    setRatingFilter(
                      event.target.value,
                    )
                    setPage(1)
                  }}
                  className="focus-ring mt-1 block rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
                >
                  {ratingFilterOptions.map(
                    ([value, label]) => (
                      <option
                        key={value || 'all'}
                        value={value}
                      >
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="text-xs font-extrabold text-stone-500">
                Sort
                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value)
                    setPage(1)
                  }}
                  className="focus-ring mt-1 block rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
                >
                  {reviewSortOptions.map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
          </div>

          {isLoading && (
            <div className="mt-6 space-y-4">
              {Array.from(
                { length: 3 },
                (_, index) => (
                  <div
                    key={index}
                    className="h-52 animate-pulse rounded-2xl bg-stone-200"
                  />
                ),
              )}
            </div>
          )}

          {isError && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <AlertTriangle
                className="mx-auto text-red-700"
                size={28}
              />

              <p className="mt-3 text-sm font-semibold text-red-700">
                {getApiErrorMessage(
                  error,
                  'Unable to load property reviews.',
                )}
              </p>

              <button
                type="button"
                onClick={() => refetch()}
                className="focus-ring mt-4 cursor-pointer rounded-lg bg-stone-950 px-4 py-2 text-xs font-black text-white"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading &&
            !isError &&
            reviews.length === 0 && (
              <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
                <MessageSquareText
                  className="mx-auto text-stone-400"
                  size={34}
                />

                <h3 className="mt-4 text-xl font-black text-stone-900">
                  No reviews found
                </h3>

                <p className="mt-2 text-sm text-stone-500">
                  {ratingFilter
                    ? 'No reviews match the selected rating.'
                    : 'This property has not received a verified review yet.'}
                </p>
              </div>
            )}

          {!isLoading &&
            !isError &&
            reviews.length > 0 && (
              <div
                className={
                  'mt-6 space-y-4 transition-opacity ' +
                  (isFetching ? 'opacity-60' : '')
                }
              >
                {reviews.map((review) => (
                  <ReviewCard
                    key={review._id}
                    review={review}
                  />
                ))}
              </div>
            )}

          {!isLoading && !isError && (
            <ActivityPagination
              pagination={data?.pagination}
              isFetching={isFetching}
              onPageChange={setPage}
            />
          )}
        </div>

        <aside className="lg:sticky lg:top-24">
          <ReviewAccess
            propertyId={propertyId}
            onReviewCreated={
              resetToNewestReviews
            }
          />
        </aside>
      </div>
    </section>
  )
}

export default PropertyReviews