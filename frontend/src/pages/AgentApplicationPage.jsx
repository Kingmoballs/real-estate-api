import {
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  Clock3,
  LoaderCircle,
  MapPin,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import {
  useEffect,
  useState,
} from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Link,
  useNavigate,
} from 'react-router-dom'
import { toast } from 'sonner'
import useAuth from '../features/auth/useAuth.js'
import {
  useMyAgentApplication,
  useSubmitAgentApplication,
} from '../features/agentApplication/agentApplicationApi.js'
import {
  agentApplicationSchema,
  applicationToFormValues,
  buildAgentApplicationPayload,
  emptyAgentApplicationValues,
} from '../features/agentApplication/agentApplicationForm.js'
import { getApiErrorMessage } from '../lib/errors.js'

const formatApplicationDate = (
  value,
) => {
  if (!value) return 'Not available'

  const date = new Date(value)

  if (
    Number.isNaN(date.getTime())
  ) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat(
    'en-NG',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date)
}

function FieldError({ error }) {
  if (!error) return null

  return (
    <span
      role="alert"
      className="mt-1.5 block text-xs font-semibold text-red-600"
    >
      {error.message}
    </span>
  )
}

function ApplicationDetails({
  application,
}) {
  return (
    <div className="mt-7 border-t border-stone-200 pt-6">
      <h2 className="text-lg font-black text-stone-900">
        Application details
      </h2>

      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-extrabold uppercase tracking-[0.1em] text-stone-400">
            Business type
          </dt>

          <dd className="mt-1 font-bold capitalize text-stone-800">
            {application.businessType}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-extrabold uppercase tracking-[0.1em] text-stone-400">
            Business name
          </dt>

          <dd className="mt-1 font-bold text-stone-800">
            {application.businessName}
          </dd>
        </div>

        {application.registrationNumber && (
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-[0.1em] text-stone-400">
              Registration number
            </dt>

            <dd className="mt-1 font-bold text-stone-800">
              {
                application.registrationNumber
              }
            </dd>
          </div>
        )}

        <div>
          <dt className="text-xs font-extrabold uppercase tracking-[0.1em] text-stone-400">
            Experience
          </dt>

          <dd className="mt-1 font-bold text-stone-800">
            {
              application.yearsOfExperience
            }{' '}
            {application.yearsOfExperience ===
            1
              ? 'year'
              : 'years'}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-extrabold uppercase tracking-[0.1em] text-stone-400">
            Submitted
          </dt>

          <dd className="mt-1 font-bold text-stone-800">
            {formatApplicationDate(
              application.submittedAt,
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-extrabold uppercase tracking-[0.1em] text-stone-400">
            Submission
          </dt>

          <dd className="mt-1 font-bold text-stone-800">
            #
            {application.submissionCount ||
              1}
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-stone-400">
          Service areas
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {application.serviceAreas?.map(
            (area) => (
              <span
                key={area}
                className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-extrabold text-emerald-800"
              >
                {area}
              </span>
            ),
          )}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-stone-400">
          Office address
        </p>

        <p className="mt-2 text-sm font-semibold leading-6 text-stone-700">
          {application.officeAddress}
        </p>
      </div>

      <div className="mt-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-stone-400">
          Professional description
        </p>

        <p className="mt-2 whitespace-pre-line text-sm leading-7 text-stone-600">
          {application.bio}
        </p>
      </div>
    </div>
  )
}

function AgentApplicationPage() {
  const { user, refreshUser } =
    useAuth()

  const navigate = useNavigate()

  const [isActivating, setIsActivating] =
    useState(false)

  const applicationQuery =
    useMyAgentApplication(
      user?.role !== 'admin',
    )

  const submitApplication =
    useSubmitAgentApplication()

  const application =
    applicationQuery.data

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm({
    resolver: zodResolver(
      agentApplicationSchema,
    ),
    defaultValues:
      emptyAgentApplicationValues,
  })

  const businessType = watch(
    'businessType',
  )

  const bio = watch('bio') || ''

  useEffect(() => {
    if (
      application?.status ===
      'rejected'
    ) {
      reset(
        applicationToFormValues(
          application,
        ),
      )
    }
  }, [application, reset])

  const handleApplicationSubmit =
    async (values) => {
      try {
        const result =
          await submitApplication.mutateAsync(
            buildAgentApplicationPayload(
              values,
            ),
          )

        toast.success(
          result.message ||
            'Agent application submitted successfully',
        )
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            'Unable to submit your agent application.',
          ),
        )
      }
    }

  const handleActivateAgentAccess =
    async () => {
      setIsActivating(true)

      try {
        const refreshedUser =
          await refreshUser()

        if (
          refreshedUser.role !==
          'agent'
        ) {
          toast.error(
            'Agent access has not been activated yet. Try refreshing again.',
          )
          return
        }

        toast.success(
          'Your agent workspace is ready',
        )

        navigate('/agent')
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            'Unable to refresh your account access.',
          ),
        )
      } finally {
        setIsActivating(false)
      }
    }

  if (user.role === 'admin') {
    return (
      <main className="page-shell py-12 sm:py-16">
        <section className="mx-auto max-w-2xl rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <ShieldCheck
            size={34}
            className="mx-auto text-stone-800"
          />

          <h1 className="mt-5 text-3xl font-black text-stone-900">
            Administrator account
          </h1>

          <p className="mt-3 text-sm leading-7 text-stone-500">
            Administrators cannot
            submit agent applications.
            Use the administration
            workspace to review
            customer applications.
          </p>

          <Link
            to="/admin"
            className="focus-ring mt-6 inline-flex rounded-xl bg-stone-950 px-5 py-3 text-sm font-black text-white"
          >
            Review applications
          </Link>
        </section>
      </main>
    )
  }

  if (user.role === 'agent') {
    return (
      <main className="page-shell py-12 sm:py-16">
        <section className="mx-auto max-w-2xl rounded-[2rem] border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm sm:p-10">
          <BadgeCheck
            size={38}
            className="mx-auto text-emerald-700"
          />

          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-700">
            Agent access active
          </p>

          <h1 className="mt-2 text-3xl font-black text-stone-900">
            Your agent account is ready
          </h1>

          <p className="mt-3 text-sm leading-7 text-stone-600">
            You can create properties,
            manage applications,
            respond to inquiries, and
            handle bookings and
            inspections.
          </p>

          <Link
            to="/agent"
            className="focus-ring mt-6 inline-flex rounded-xl bg-emerald-950 px-5 py-3 text-sm font-black text-white"
          >
            Open agent workspace
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell py-10 sm:py-14">
      <section className="rounded-[2rem] bg-emerald-950 px-6 py-8 text-white sm:px-10 sm:py-10">
        <span className="grid size-12 place-items-center rounded-xl bg-white/10">
          <BriefcaseBusiness
            size={23}
          />
        </span>

        <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-200">
          Agent onboarding
        </p>

        <h1 className="mt-2 max-w-2xl text-3xl font-black tracking-[-0.045em] sm:text-4xl">
          Apply to list and manage
          properties on Haven
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-100/75">
          Tell us about your property
          business and the areas you
          serve. A platform
          administrator will review
          your application before
          agent access is activated.
        </p>
      </section>

      {applicationQuery.isLoading && (
        <section className="mt-8 grid min-h-72 place-items-center rounded-[2rem] border border-stone-200 bg-white">
          <p className="flex items-center gap-2 text-sm font-bold text-stone-500">
            <LoaderCircle
              size={19}
              className="animate-spin"
            />
            Checking your application...
          </p>
        </section>
      )}

      {applicationQuery.isError && (
        <section className="mt-8 rounded-[2rem] border border-red-200 bg-red-50 px-6 py-12 text-center">
          <AlertTriangle
            size={30}
            className="mx-auto text-red-700"
          />

          <h2 className="mt-4 text-xl font-black text-stone-900">
            We could not load your
            application
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {getApiErrorMessage(
              applicationQuery.error,
              'Check your connection and try again.',
            )}
          </p>

          <button
            type="button"
            onClick={() =>
              applicationQuery.refetch()
            }
            className="focus-ring mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white"
          >
            <RefreshCw size={17} />
            Try again
          </button>
        </section>
      )}

      {!applicationQuery.isLoading &&
        !applicationQuery.isError &&
        application?.status ===
          'pending' && (
          <section className="mx-auto mt-8 max-w-3xl rounded-[2rem] border border-amber-200 bg-white p-7 shadow-sm sm:p-9">
            <span className="grid size-12 place-items-center rounded-xl bg-amber-100 text-amber-800">
              <Clock3 size={23} />
            </span>

            <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.14em] text-amber-700">
              Application pending
            </p>

            <h2 className="mt-2 text-2xl font-black text-stone-900">
              Your application is
              being reviewed
            </h2>

            <p className="mt-3 text-sm leading-7 text-stone-600">
              You cannot submit another
              application while this
              one is pending. Refresh
              this page later to check
              the administrator’s
              decision.
            </p>

            <button
              type="button"
              onClick={() =>
                applicationQuery.refetch()
              }
              disabled={
                applicationQuery.isFetching
              }
              className="focus-ring mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  applicationQuery.isFetching
                    ? 'animate-spin'
                    : ''
                }
              />
              Refresh status
            </button>

            <ApplicationDetails
              application={
                application
              }
            />
          </section>
        )}

      {!applicationQuery.isLoading &&
        !applicationQuery.isError &&
        application?.status ===
          'approved' && (
          <section className="mx-auto mt-8 max-w-3xl rounded-[2rem] border border-emerald-200 bg-emerald-50 p-7 shadow-sm sm:p-9">
            <BadgeCheck
              size={38}
              className="text-emerald-700"
            />

            <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-700">
              Application approved
            </p>

            <h2 className="mt-2 text-2xl font-black text-stone-900">
              Welcome to the Haven
              agent network
            </h2>

            <p className="mt-3 text-sm leading-7 text-stone-600">
              Your application has
              been approved. Refresh
              your account access to
              enter the agent
              workspace.
            </p>

            <button
              type="button"
              onClick={
                handleActivateAgentAccess
              }
              disabled={isActivating}
              className="focus-ring mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
            >
              {isActivating ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <BadgeCheck
                  size={17}
                />
              )}

              {isActivating
                ? 'Activating access...'
                : 'Open agent workspace'}
            </button>

            <ApplicationDetails
              application={
                application
              }
            />
          </section>
        )}

      {!applicationQuery.isLoading &&
        !applicationQuery.isError &&
        (!application ||
          application.status ===
            'rejected') && (
          <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <form
              onSubmit={handleSubmit(
                handleApplicationSubmit,
              )}
              className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
            >
              {application?.status ===
                'rejected' && (
                <div className="mb-7 rounded-2xl border border-red-200 bg-red-50 p-5">
                  <div className="flex items-start gap-3">
                    <RotateCcw
                      size={21}
                      className="mt-0.5 shrink-0 text-red-700"
                    />

                    <div>
                      <h2 className="font-black text-red-800">
                        Application
                        requires changes
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-red-700">
                        {
                          application.rejectionReason
                        }
                      </p>

                      <p className="mt-3 text-xs font-bold text-red-600">
                        Update your
                        information and
                        submit it again.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <h2 className="text-2xl font-black text-stone-900">
                {application
                  ? 'Update and resubmit'
                  : 'Agent application'}
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Fields marked as
                required must be
                completed before your
                application can be
                reviewed.
              </p>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-bold text-stone-700">
                  Business type

                  <select
                    {...register(
                      'businessType',
                    )}
                    className="focus-ring mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-3 font-normal"
                  >
                    <option value="individual">
                      Individual agent
                    </option>

                    <option value="company">
                      Registered company
                    </option>
                  </select>

                  <FieldError
                    error={
                      errors.businessType
                    }
                  />
                </label>

                <label className="block text-sm font-bold text-stone-700">
                  Business or trading
                  name

                  <input
                    type="text"
                    maxLength={150}
                    {...register(
                      'businessName',
                    )}
                    className="focus-ring mt-2 h-12 w-full rounded-xl border border-stone-300 px-4 font-normal"
                  />

                  <FieldError
                    error={
                      errors.businessName
                    }
                  />
                </label>

                {businessType ===
                  'company' && (
                  <label className="block text-sm font-bold text-stone-700">
                    Registration number

                    <input
                      type="text"
                      maxLength={100}
                      {...register(
                        'registrationNumber',
                      )}
                      className="focus-ring mt-2 h-12 w-full rounded-xl border border-stone-300 px-4 font-normal"
                    />

                    <FieldError
                      error={
                        errors.registrationNumber
                      }
                    />
                  </label>
                )}

                <label className="block text-sm font-bold text-stone-700">
                  Years of experience

                  <input
                    type="number"
                    min="0"
                    max="70"
                    {...register(
                      'yearsOfExperience',
                    )}
                    className="focus-ring mt-2 h-12 w-full rounded-xl border border-stone-300 px-4 font-normal"
                  />

                  <FieldError
                    error={
                      errors.yearsOfExperience
                    }
                  />
                </label>

                <label className="block text-sm font-bold text-stone-700 sm:col-span-2">
                  Service areas

                  <textarea
                    rows={3}
                    {...register(
                      'serviceAreas',
                    )}
                    placeholder="Lekki, Victoria Island, Ikoyi"
                    className="focus-ring mt-2 w-full resize-y rounded-xl border border-stone-300 p-4 font-normal leading-6"
                  />

                  <p className="mt-1.5 text-xs font-semibold text-stone-400">
                    Separate locations
                    with commas or put
                    each location on a
                    new line.
                  </p>

                  <FieldError
                    error={
                      errors.serviceAreas
                    }
                  />
                </label>

                <label className="block text-sm font-bold text-stone-700 sm:col-span-2">
                  Office address

                  <textarea
                    rows={2}
                    maxLength={300}
                    {...register(
                      'officeAddress',
                    )}
                    placeholder="10 Example Street, Lekki, Lagos"
                    className="focus-ring mt-2 w-full resize-y rounded-xl border border-stone-300 p-4 font-normal leading-6"
                  />

                  <FieldError
                    error={
                      errors.officeAddress
                    }
                  />
                </label>

                <label className="block text-sm font-bold text-stone-700 sm:col-span-2">
                  Professional
                  description

                  <textarea
                    rows={6}
                    maxLength={1000}
                    {...register('bio')}
                    placeholder="Describe your experience, the properties you handle, and how you support customers."
                    className="focus-ring mt-2 w-full resize-y rounded-xl border border-stone-300 p-4 font-normal leading-7"
                  />

                  <div className="mt-1.5 flex justify-between gap-3 text-xs font-semibold">
                    <FieldError
                      error={errors.bio}
                    />

                    <span className="ml-auto text-stone-400">
                      {bio.length}/1000
                    </span>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  submitApplication.isPending
                }
                className="focus-ring mt-7 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-4 font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {(isSubmitting ||
                  submitApplication.isPending) && (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                )}

                {isSubmitting ||
                submitApplication.isPending
                  ? 'Submitting application...'
                  : application
                    ? 'Resubmit application'
                    : 'Submit application'}
              </button>
            </form>

            <aside className="space-y-5 lg:sticky lg:top-24">
              <section className="rounded-[1.6rem] bg-emerald-950 p-6 text-white">
                <ShieldCheck
                  size={25}
                  className="text-emerald-200"
                />

                <h2 className="mt-4 text-lg font-black">
                  What happens next?
                </h2>

                <ol className="mt-4 space-y-4 text-sm leading-6 text-emerald-100/75">
                  <li>
                    <strong className="text-white">
                      1. Review:
                    </strong>{' '}
                    An administrator
                    checks your
                    application.
                  </li>

                  <li>
                    <strong className="text-white">
                      2. Decision:
                    </strong>{' '}
                    Your status changes
                    to approved or
                    rejected.
                  </li>

                  <li>
                    <strong className="text-white">
                      3. Access:
                    </strong>{' '}
                    Approved applicants
                    receive the agent
                    workspace.
                  </li>
                </ol>
              </section>

              <section className="rounded-[1.6rem] border border-stone-200 bg-white p-6">
                <MapPin
                  size={23}
                  className="text-amber-700"
                />

                <h2 className="mt-4 font-black text-stone-900">
                  Accurate information
                </h2>

                <p className="mt-2 text-sm leading-6 text-stone-500">
                  Enter real business
                  information and the
                  locations where you
                  actively provide
                  property services.
                </p>
              </section>
            </aside>
          </div>
        )}
    </main>
  )
}

export default AgentApplicationPage