import {
  AlertTriangle,
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Car,
  Check,
  Clock3,
  Mail,
  MapPin,
  Maximize2,
  Phone,
  Sofa,
  UserRound,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import ConfirmAction from '../../components/activity/ConfirmAction.jsx'
import ReasonAction from '../../components/activity/ReasonAction.jsx'
import StatusBadge from '../../components/activity/StatusBadge.jsx'
import PropertyGallery from '../../components/property/PropertyGallery.jsx'
import { formatDateTime } from '../../features/activity/activityFormatters.js'
import {
  useAdminProperty,
  useApproveAdminProperty,
  useRejectAdminProperty,
} from '../../features/admin/adminPropertyApi.js'
import {
  formatAmenity,
  formatPropertyPrice,
  formatPropertySize,
  formatPropertyType,
  getPropertyLocation,
} from '../../features/properties/propertyFormatters.js'
import { getApiErrorMessage } from '../../lib/errors.js'

const listingLabels = {
  shortlet: 'Serviced shortlet',
  rent: 'Long-term rental',
  sale: 'Property for sale',
}

const formatAmount = (amount, currency = 'NGN') =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))

function AdminPropertyReviewPage() {
  const { propertyId } = useParams()
  const navigate = useNavigate()

  const {
    data: property,
    error,
    isError,
    isLoading,
    refetch,
  } = useAdminProperty(propertyId)

  const approveMutation = useApproveAdminProperty()
  const rejectMutation = useRejectAdminProperty()

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-6 w-48 rounded bg-stone-200" />
        <div className="aspect-[16/7] rounded-2xl bg-stone-200" />
        <div className="h-80 rounded-2xl bg-stone-200" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertTriangle className="mx-auto text-red-700" size={28} />

        <p className="mt-3 text-sm font-semibold text-red-700">
          {getApiErrorMessage(
            error,
            'Unable to load this property.',
          )}
        </p>

        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="focus-ring cursor-pointer rounded-lg bg-stone-950 px-4 py-2 text-xs font-black text-white"
          >
            Try again
          </button>

          <Link
            to="/admin/properties"
            className="focus-ring rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-black text-stone-700"
          >
            Back to reviews
          </Link>
        </div>
      </div>
    )
  }

  const agent = property.postedBy || {
    name: property.agentName,
    email: property.agentEmail,
    phone: property.agentPhone,
  }

  const propertyFacts = [
    {
      icon: BedDouble,
      label: 'Bedrooms',
      value: property.bedrooms || 0,
    },
    {
      icon: Bath,
      label: 'Bathrooms',
      value: property.bathrooms || 0,
    },
    {
      icon: Car,
      label: 'Parking spaces',
      value: property.parkingSpaces || 0,
    },
    {
      icon: Sofa,
      label: 'Furnishing',
      value: formatAmenity(property.furnishingStatus),
    },
    {
      icon: Maximize2,
      label: 'Property size',
      value: formatPropertySize(property) || 'Not provided',
    },
    {
      icon: Building2,
      label: 'Year built',
      value: property.yearBuilt || 'Not provided',
    },
  ]

  const fees = [
    ['Service charge', property.serviceCharge],
    ['Security deposit', property.securityDeposit],
    ['Cleaning fee', property.cleaningFee],
  ]

  const coordinates = property.geoLocation?.coordinates
  const hasCoordinates =
    Array.isArray(coordinates) && coordinates.length === 2

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(property._id)
      toast.success('Property approved and published')
      navigate('/admin/properties')
    } catch (actionError) {
      toast.error(
        getApiErrorMessage(
          actionError,
          'Unable to approve this property.',
        ),
      )

      throw actionError
    }
  }

  const handleReject = async (reason) => {
    try {
      await rejectMutation.mutateAsync({
        propertyId: property._id,
        reason,
      })

      toast.success('Property rejected with review feedback')
      navigate('/admin/properties')
    } catch (actionError) {
      toast.error(
        getApiErrorMessage(
          actionError,
          'Unable to reject this property.',
        ),
      )

      throw actionError
    }
  }

  return (
    <div>
      <Link
        to="/admin/properties"
        className="focus-ring mb-5 flex w-fit items-center gap-2 text-sm font-extrabold text-stone-600"
      >
        <ArrowLeft size={17} />
        Back to property reviews
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Property moderation</p>

          <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-stone-900">
            {property.title}
          </h2>

          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-stone-500">
            <MapPin size={16} />
            {getPropertyLocation(property) || 'Location not provided'}
          </p>
        </div>

        <StatusBadge status={property.listingStatus} />
      </div>

      <section className="mt-6">
        <PropertyGallery property={property} />
      </section>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-extrabold text-emerald-900">
                {listingLabels[property.listingType]}
              </span>

              <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-extrabold text-stone-700">
                {formatPropertyType(property.propertyType)}
              </span>
            </div>

            <p className="mt-5 text-3xl font-black text-emerald-950">
              {formatPropertyPrice(property)}
            </p>

            <div className="mt-6 grid gap-4 border-y border-stone-100 py-6 sm:grid-cols-2 lg:grid-cols-3">
              {propertyFacts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-stone-100 text-emerald-900">
                    <Icon size={18} />
                  </span>

                  <div>
                    <p className="text-xs font-bold text-stone-400">
                      {label}
                    </p>

                    <p className="mt-1 text-sm font-extrabold text-stone-800">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="mt-7 text-xl font-black text-stone-900">
              Description
            </h3>

            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-600">
              {property.description}
            </p>

            {property.amenities?.length > 0 && (
              <div className="mt-7 border-t border-stone-100 pt-7">
                <h3 className="text-xl font-black text-stone-900">
                  Amenities
                </h3>

                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {property.amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="flex items-center gap-2 text-sm font-semibold text-stone-600"
                    >
                      <span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                        <Check size={14} strokeWidth={3} />
                      </span>

                      {formatAmenity(amenity)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <h3 className="text-xl font-black text-stone-900">
              Location information
            </h3>

            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <Detail label="Street address" value={property.address?.streetAddress} />
              <Detail label="City" value={property.address?.city} />
              <Detail label="State" value={property.address?.state} />
              <Detail label="LGA" value={property.address?.lga} />
              <Detail label="Country" value={property.address?.country} />
              <Detail label="Postal code" value={property.address?.postalCode} />
            </dl>

            {hasCoordinates && (
              <div className="mt-5 rounded-xl bg-stone-50 p-4 text-xs text-stone-600">
                <p>
                  Latitude: <strong>{coordinates[1]}</strong>
                </p>

                <p className="mt-1">
                  Longitude: <strong>{coordinates[0]}</strong>
                </p>

                <p className="mt-2 leading-5 text-stone-500">
                  These coordinates will later be displayed through the Google
                  Maps integration.
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <section className="rounded-2xl bg-stone-950 p-6 text-white">
            <span className="grid size-11 place-items-center rounded-xl bg-white/10">
              <UserRound size={21} />
            </span>

            <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.14em] text-stone-400">
              Listing agent
            </p>

            <h3 className="mt-2 text-xl font-black">
              {agent.name || property.agentName}
            </h3>

            <div className="mt-5 space-y-3">
              {(agent.email || property.agentEmail) && (
                <a
                  href={'mailto:' + (agent.email || property.agentEmail)}
                  className="flex items-center gap-2 text-sm text-stone-300 hover:text-white"
                >
                  <Mail size={16} />
                  {agent.email || property.agentEmail}
                </a>
              )}

              {(agent.phone || property.agentPhone) && (
                <a
                  href={'tel:' + (agent.phone || property.agentPhone)}
                  className="flex items-center gap-2 text-sm text-stone-300 hover:text-white"
                >
                  <Phone size={16} />
                  {agent.phone || property.agentPhone}
                </a>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <h3 className="font-black text-stone-900">
              Pricing details
            </h3>

            <dl className="mt-4 space-y-3">
              {fees.map(([label, amount]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 text-xs"
                >
                  <dt className="font-semibold text-stone-500">
                    {label}
                  </dt>

                  <dd className="font-extrabold text-stone-800">
                    {formatAmount(amount, property.currency)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <h3 className="font-black text-stone-900">
              Review history
            </h3>

            <p className="mt-3 flex items-center gap-2 text-xs text-stone-600">
              <Clock3 size={14} />
              Submitted {formatDateTime(property.submittedForReviewAt)}
            </p>

            {property.reviewedAt && (
              <p className="mt-2 text-xs text-stone-600">
                Reviewed {formatDateTime(property.reviewedAt)}
              </p>
            )}

            {property.reviewedBy && (
              <p className="mt-2 text-xs text-stone-600">
                Reviewer: {property.reviewedBy.name}
              </p>
            )}

            {property.rejectionReason && (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold leading-5 text-red-700">
                Rejection reason: {property.rejectionReason}
              </p>
            )}
          </section>

          {property.listingStatus === 'pendingReview' && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="font-black text-stone-900">
                Moderation decision
              </h3>

              <p className="mt-2 text-xs leading-5 text-stone-600">
                Approval immediately publishes this property on the public
                marketplace.
              </p>

              <div className="mt-4 space-y-2">
                <ConfirmAction
                  buttonLabel="Approve property"
                  confirmLabel="Approve and publish"
                  description="Confirm that the property information, images, pricing, and agent details are suitable for publication."
                  isPending={approveMutation.isPending}
                  onConfirm={handleApprove}
                />

                <ReasonAction
                  buttonLabel="Reject property"
                  confirmLabel="Reject and send feedback"
                  reasonLabel="Reason for rejecting this property"
                  minimumLength={10}
                  isPending={rejectMutation.isPending}
                  onConfirm={handleReject}
                />
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold text-stone-400">{label}</dt>
      <dd className="mt-1 font-extrabold text-stone-700">
        {value || 'Not provided'}
      </dd>
    </div>
  )
}

export default AdminPropertyReviewPage