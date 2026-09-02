import {
  AlertTriangle,
  BadgeCheck,
  LoaderCircle,
  MessageSquareText,
  Pencil,
  Star,
} from 'lucide-react'
import { useState } from 'react'
import {
  Link,
  useSearchParams,
} from 'react-router-dom'
import { toast } from 'sonner'
import ActivityPagination from '../../components/activity/ActivityPagination.jsx'
import ConfirmAction from '../../components/activity/ConfirmAction.jsx'
import PropertyImage from '../../components/property/PropertyImage.jsx'
import {
  useAgentReviews,
  useDeleteAgentReviewResponse,
  useSaveAgentReviewResponse,
} from '../../features/reviews/reviewApi.js'
import { getPropertyId } from '../../features/properties/propertyFormatters.js'
import { getApiErrorMessage } from '../../lib/errors.js'

const reviewStatuses = [
  ['', 'All statuses'],
  ['published', 'Published'],
  ['hidden', 'Hidden'],
]

const ratingOptions = [
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

function ReviewStars({ rating }) {
  const numericRating = Number(rating || 0)

  return (
    <span
      className="flex items-center gap-0.5 text-amber-500"
      aria-label={`${numericRating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={16}
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

function ReviewResponseForm({
  initialComment,
  isPending,
  onCancel,
  onSave,
}) {
  const [comment, setComment] = useState(
    initialComment || '',
  )

  const trimmedComment = comment.trim()
  const canSave =
    trimmedComment.length >= 2 &&
    !isPending

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!canSave) return

    try {
      await onSave(trimmedComment)
    } catch {
      // The parent displays the API error.
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
    >
      <label className="block text-xs font-extrabold text-emerald-900">
        Response to the customer

        <textarea
          required
          autoFocus
          minLength={2}
          maxLength={1500}
          rows={4}
          value={comment}
          onChange={(event) =>
            setComment(event.target.value)
          }
          placeholder="Thank the customer or address the feedback professionally."
          className="focus-ring mt-2 w-full resize-y rounded-lg border border-emerald-200 bg-white p-3 text-sm font-normal leading-6 text-stone-800"
        />
      </label>

      <div className="mt-2 flex justify-between gap-3 text-xs text-stone-500">
        <span>Minimum 2 characters</span>
        <span>{comment.length} / 1500</span>
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
            ? 'Saving response…'
            : 'Save response'}
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

function AgentReviewCard({
  review,
  isResponding,
  saveMutation,
  deleteMutation,
  onStartResponding,
  onStopResponding,
  onSaveResponse,
  onDeleteResponse,
}) {
  const property = review.property || {
    title: 'Property unavailable',
    images: [],
  }

  const propertyId = getPropertyId(property)

  const responseIsDeleting =
    deleteMutation.isPending &&
    deleteMutation.variables === review._id

  return (
    <article className="grid gap-5 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-[180px_1fr] md:p-5">
      <PropertyImage
        property={property}
        className="aspect-[4/3] w-full rounded-xl md:aspect-square"
        sizes="180px"
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {propertyId ? (
              <Link
                to={
                  '/agent/properties/' +
                  propertyId +
                  '/edit'
                }
                className="focus-ring text-lg font-black text-stone-900 hover:text-emerald-800"
              >
                {property.title}
              </Link>
            ) : (
              <h3 className="text-lg font-black text-stone-900">
                {property.title}
              </h3>
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

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ReviewStars rating={review.rating} />

          <span className="text-xs font-semibold text-stone-500">
            {review.customer?.name ||
              'Verified customer'}
          </span>

          <span className="text-xs text-stone-400">
            {formatReviewDate(
              review.createdAt,
            )}
          </span>
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
              public property pages.
            </p>

            {review.moderationReason && (
              <p className="mt-2 text-xs leading-5 text-red-700">
                Moderation reason:{' '}
                {review.moderationReason}
              </p>
            )}
          </div>
        )}

        {review.agentResponse?.comment &&
          !isResponding && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
                Your response
              </p>

              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600">
                {
                  review.agentResponse
                    .comment
                }
              </p>

              {review.agentResponse
                .respondedAt && (
                <p className="mt-2 text-xs font-semibold text-stone-400">
                  Responded{' '}
                  {formatReviewDate(
                    review.agentResponse
                      .respondedAt,
                  )}
                </p>
              )}
            </div>
          )}

        {isResponding && (
          <ReviewResponseForm
            initialComment={
              review.agentResponse?.comment
            }
            isPending={
              saveMutation.isPending
            }
            onCancel={onStopResponding}
            onSave={onSaveResponse}
          />
        )}

        {!isResponding && (
          <div className="mt-4 flex flex-wrap items-start gap-2 border-t border-stone-100 pt-4">
            <button
              type="button"
              disabled={
                saveMutation.isPending ||
                deleteMutation.isPending
              }
              onClick={onStartResponding}
              className="focus-ring flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-extrabold text-emerald-900 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Pencil size={14} />

              {review.agentResponse?.comment
                ? 'Edit response'
                : 'Respond to review'}
            </button>

            {review.agentResponse?.comment && (
              <ConfirmAction
                buttonLabel="Remove response"
                confirmLabel={
                  responseIsDeleting
                    ? 'Removing…'
                    : 'Remove response'
                }
                description="This removes your response from the public property review."
                tone="danger"
                isPending={
                  responseIsDeleting
                }
                onConfirm={
                  onDeleteResponse
                }
              />
            )}
          </div>
        )}
      </div>
    </article>
  )
}

function AgentReviewsPage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams()

  const page = Math.max(
    Number(searchParams.get('page')) || 1,
    1,
  )

  const status =
    searchParams.get('status') || ''

  const rating =
    searchParams.get('rating') || ''

  const params = {
    page,
    limit: 8,
  }

  if (status) {
    params.status = status
  }

  if (rating) {
    params.rating = rating
  }

  const {
    data,
    error,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useAgentReviews(params)

  const saveMutation =
    useSaveAgentReviewResponse()

  const deleteMutation =
    useDeleteAgentReviewResponse()

  const [
    respondingReviewId,
    setRespondingReviewId,
  ] = useState(null)

  const reviews = data?.reviews || []

  const updateParams = (updates) => {
    const nextParams =
      new URLSearchParams(searchParams)

    Object.entries(updates).forEach(
      ([key, value]) => {
        if (
          value !== '' &&
          value !== null &&
          value !== undefined
        ) {
          nextParams.set(
            key,
            String(value),
          )
        } else {
          nextParams.delete(key)
        }
      },
    )

    setSearchParams(nextParams)
  }

  const handleSaveResponse = async (
    reviewId,
    comment,
  ) => {
    try {
      await saveMutation.mutateAsync({
        reviewId,
        comment,
      })

      setRespondingReviewId(null)
      toast.success('Response saved')
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to save the response.',
        ),
      )

      throw error
    }
  }

  const handleDeleteResponse = async (
    reviewId,
  ) => {
    try {
      await deleteMutation.mutateAsync(
        reviewId,
      )

      toast.success('Response removed')
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to remove the response.',
        ),
      )

      throw error
    }
  }

  return (
    <div>
      <div>
        <p className="eyebrow">
          Customer feedback
        </p>

        <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-stone-900">
          Property reviews
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
          Read verified customer feedback and
          respond professionally on behalf of
          your listings.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-stone-200 bg-white p-4">
        <label className="text-xs font-extrabold text-stone-500">
          Status

          <select
            value={status}
            onChange={(event) =>
              updateParams({
                status:
                  event.target.value,
                page: null,
              })
            }
            className="focus-ring ml-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
          >
            {reviewStatuses.map(
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
          Rating

          <select
            value={rating}
            onChange={(event) =>
              updateParams({
                rating:
                  event.target.value,
                page: null,
              })
            }
            className="focus-ring ml-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
          >
            {ratingOptions.map(
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
      </div>

      {isLoading && (
        <div className="mt-6 space-y-4">
          {Array.from(
            { length: 3 },
            (_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-2xl border border-stone-200 bg-white"
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
            className="focus-ring mt-4 cursor-pointer rounded-lg bg-emerald-950 px-4 py-2 text-xs font-black text-white"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading &&
        !isError &&
        reviews.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
            <MessageSquareText
              className="mx-auto text-stone-400"
              size={36}
            />

            <h3 className="mt-4 text-xl font-black text-stone-900">
              No reviews found
            </h3>

            <p className="mt-2 text-sm text-stone-500">
              Reviews for your properties will
              appear here.
            </p>
          </div>
        )}

      {!isLoading &&
        !isError &&
        reviews.length > 0 && (
          <div
            className={
              'mt-6 space-y-5 transition-opacity ' +
              (isFetching
                ? 'opacity-60'
                : '')
            }
          >
            {reviews.map((review) => (
              <AgentReviewCard
                key={review._id}
                review={review}
                isResponding={
                  respondingReviewId ===
                  review._id
                }
                saveMutation={
                  saveMutation
                }
                deleteMutation={
                  deleteMutation
                }
                onStartResponding={() =>
                  setRespondingReviewId(
                    review._id,
                  )
                }
                onStopResponding={() =>
                  setRespondingReviewId(
                    null,
                  )
                }
                onSaveResponse={(comment) =>
                  handleSaveResponse(
                    review._id,
                    comment,
                  )
                }
                onDeleteResponse={() =>
                  handleDeleteResponse(
                    review._id,
                  )
                }
              />
            ))}
          </div>
        )}

      {!isLoading && !isError && (
        <ActivityPagination
          pagination={data?.pagination}
          isFetching={isFetching}
          onPageChange={(nextPage) =>
            updateParams({
              page: nextPage,
            })
          }
        />
      )}
    </div>
  )
}

export default AgentReviewsPage