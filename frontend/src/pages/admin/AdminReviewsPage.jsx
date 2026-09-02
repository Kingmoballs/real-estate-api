import {
  AlertTriangle,
  BadgeCheck,
  MessageSquareText,
  Star,
  UserRound,
} from 'lucide-react'
import {
  Link,
  useSearchParams,
} from 'react-router-dom'
import { toast } from 'sonner'
import ActivityPagination from '../../components/activity/ActivityPagination.jsx'
import ConfirmAction from '../../components/activity/ConfirmAction.jsx'
import ReasonAction from '../../components/activity/ReasonAction.jsx'
import PropertyImage from '../../components/property/PropertyImage.jsx'
import {
  useAdminReviews,
  useDeleteReview,
  useModerateReview,
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

const formatReviewDate = (value) => {
  if (!value) return 'Not available'

  return new Intl.DateTimeFormat(
    'en-NG',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(new Date(value))
}

function ReviewStars({ rating }) {
  const numericRating =
    Number(rating || 0)

  return (
    <span
      className="flex items-center gap-0.5 text-amber-500"
      aria-label={`${numericRating} out of 5 stars`}
    >
      {Array.from(
        { length: 5 },
        (_, index) => (
          <Star
            key={index}
            size={16}
            fill={
              index < numericRating
                ? 'currentColor'
                : 'none'
            }
          />
        ),
      )}
    </span>
  )
}

function AdminReviewCard({
  review,
  moderateMutation,
  deleteMutation,
  runAction,
}) {
  const property = review.property || {
    title: 'Property unavailable',
    images: [],
  }

  const propertyId =
    getPropertyId(property)

  const isDeleting =
    deleteMutation.isPending &&
    deleteMutation.variables ===
      review._id

  const isModerating =
    moderateMutation.isPending &&
    moderateMutation.variables
      ?.reviewId === review._id

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
                  '/admin/properties/' +
                  propertyId
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

            <p className="mt-1 text-xs font-semibold text-stone-500">
              Listing agent:{' '}
              <span className="font-extrabold text-stone-700">
                {review.propertyAgent
                  ?.name ||
                  'Unavailable'}
              </span>
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

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-stone-50 p-3">
          <span className="flex items-center gap-1.5 text-xs font-extrabold text-stone-700">
            <UserRound size={14} />

            {review.customer?.name ||
              'Verified customer'}
          </span>

          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <BadgeCheck size={14} />

            {review.verificationSource ===
            'booking'
              ? 'Completed stay'
              : 'Completed inspection'}
          </span>

          <span className="text-xs text-stone-400">
            {formatReviewDate(
              review.createdAt,
            )}
          </span>
        </div>

        <div className="mt-4">
          <ReviewStars
            rating={review.rating}
          />
        </div>

        {review.title && (
          <h3 className="mt-4 font-black text-stone-900">
            {review.title}
          </h3>
        )}

        <p className="mt-2 whitespace-pre-line text-sm leading-7 text-stone-600">
          {review.comment}
        </p>

        {review.agentResponse?.comment && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
              Agent response
            </p>

            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600">
              {
                review.agentResponse
                  .comment
              }
            </p>

            <p className="mt-2 text-xs font-semibold text-stone-500">
              Responded by{' '}
              {review.agentResponse
                .respondedBy?.name ||
                review.propertyAgent
                  ?.name ||
                'Listing agent'}
            </p>
          </div>
        )}

        {review.status === 'hidden' && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-black text-red-800">
              Review hidden from the public
            </p>

            {review.moderationReason && (
              <p className="mt-2 text-xs leading-5 text-red-700">
                Reason:{' '}
                {review.moderationReason}
              </p>
            )}

            {(review.moderatedBy ||
              review.moderatedAt) && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                Moderated by{' '}
                {review.moderatedBy
                  ?.name || 'Administrator'}

                {review.moderatedAt
                  ? ' on ' +
                    formatReviewDate(
                      review.moderatedAt,
                    )
                  : ''}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-start gap-2 border-t border-stone-100 pt-4">
          {review.status ===
            'published' && (
            <ReasonAction
              buttonLabel="Hide review"
              confirmLabel="Hide review"
              reasonLabel="Reason for hiding this review"
              minimumLength={3}
              isPending={isModerating}
              onConfirm={(reason) =>
                runAction(
                  () =>
                    moderateMutation.mutateAsync({
                      reviewId:
                        review._id,
                      status:
                        'hidden',
                      reason,
                    }),
                  'Review hidden from public pages',
                  'Unable to hide this review.',
                )
              }
            />
          )}

          {review.status === 'hidden' && (
            <ConfirmAction
              buttonLabel="Republish review"
              confirmLabel={
                isModerating
                  ? 'Republishing…'
                  : 'Republish review'
              }
              description="This review will become visible again and will be included in the property’s public rating."
              isPending={isModerating}
              onConfirm={() =>
                runAction(
                  () =>
                    moderateMutation.mutateAsync({
                      reviewId:
                        review._id,
                      status:
                        'published',
                    }),
                  'Review republished',
                  'Unable to republish this review.',
                )
              }
            />
          )}

          <ConfirmAction
            buttonLabel="Delete permanently"
            confirmLabel={
              isDeleting
                ? 'Deleting…'
                : 'Delete review'
            }
            description="This permanently deletes the customer review, its agent response, and its contribution to the property rating."
            tone="danger"
            isPending={isDeleting}
            onConfirm={() =>
              runAction(
                () =>
                  deleteMutation.mutateAsync(
                    review._id,
                  ),
                'Review permanently deleted',
                'Unable to delete this review.',
                true,
              )
            }
          />
        </div>
      </div>
    </article>
  )
}

function AdminReviewsPage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams()

  const page = Math.max(
    Number(searchParams.get('page')) ||
      1,
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
  } = useAdminReviews(params)

  const moderateMutation =
    useModerateReview()

  const deleteMutation =
    useDeleteReview()

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

  const runAction = async (
    operation,
    successMessage,
    fallbackMessage,
    moveBackWhenLastItem = false,
  ) => {
    try {
      await operation()
      toast.success(successMessage)

      if (
        moveBackWhenLastItem &&
        reviews.length === 1 &&
        page > 1
      ) {
        updateParams({
          page: page - 1,
        })
      }
    } catch (actionError) {
      toast.error(
        getApiErrorMessage(
          actionError,
          fallbackMessage,
        ),
      )

      throw actionError
    }
  }

  return (
    <div>
      <div>
        <p className="eyebrow">
          Trust and safety
        </p>

        <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-stone-900">
          Customer review moderation
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
          Review verified customer feedback,
          hide content that violates platform
          standards, and restore content after
          review.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4">
        <span className="flex items-center gap-2 text-sm font-black text-stone-700">
          <MessageSquareText
            size={18}
            className="text-amber-700"
          />
          Platform review queue
        </span>

        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-xs font-extrabold text-stone-500">
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
              className="focus-ring rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
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

          <label className="flex items-center gap-2 text-xs font-extrabold text-stone-500">
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
              className="focus-ring rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
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
      </div>

      {isLoading && (
        <div className="mt-6 space-y-4">
          {Array.from(
            { length: 3 },
            (_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-2xl border border-stone-200 bg-white"
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
              'Unable to load platform reviews.',
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
          <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
            <MessageSquareText
              className="mx-auto text-stone-400"
              size={36}
            />

            <h3 className="mt-4 text-xl font-black text-stone-900">
              No reviews found
            </h3>

            <p className="mt-2 text-sm text-stone-500">
              There are no reviews matching
              the selected filters.
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
              <AdminReviewCard
                key={review._id}
                review={review}
                moderateMutation={
                  moderateMutation
                }
                deleteMutation={
                  deleteMutation
                }
                runAction={runAction}
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

export default AdminReviewsPage