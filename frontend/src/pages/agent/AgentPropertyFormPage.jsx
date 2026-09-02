import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  ArrowLeft,
  ImagePlus,
  LoaderCircle,
  Save,
  Send,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  amenities,
  emptyPropertyValues,
  mapPropertyToForm,
  numberInputOptions,
  propertySchema,
  propertyTypes,
} from '../../features/agent/agentPropertyForm.js'
import {
  useAgentProperty,
  useCreateAgentProperty,
  useUpdateAgentProperty,
} from '../../features/agent/agentPropertyApi.js'
import { getApiErrorMessage } from '../../lib/errors.js'

const imageTypes = ['image/jpeg', 'image/png', 'image/webp']
const maximumYearBuilt = new Date().getFullYear() + 1

function FieldError({ error }) {
  if (!error) return null

  return (
    <span className="mt-1.5 block text-xs font-semibold text-red-600">
      {error.message}
    </span>
  )
}

function FormSection({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-xl font-black text-stone-900">{title}</h2>
      {description && (
        <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
      )}
      <div className="mt-6">{children}</div>
    </section>
  )
}

function PropertyEditor({ property }) {
  const isEdit = Boolean(property)
  const navigate = useNavigate()
  const createMutation = useCreateAgentProperty()
  const updateMutation = useUpdateAgentProperty()
  const initialValues = isEdit
    ? mapPropertyToForm(property)
    : emptyPropertyValues
  const [listingType, setListingType] = useState(initialValues.listingType)
  const [files, setFiles] = useState([])
  const [fileError, setFileError] = useState('')
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(propertySchema),
    defaultValues: initialValues,
  })
  const isSaving = createMutation.isPending || updateMutation.isPending
  const pricePeriods =
    listingType === 'shortlet'
      ? [['night', 'Per night']]
      : listingType === 'sale'
        ? [['total', 'Total price']]
        : [
            ['month', 'Per month'],
            ['year', 'Per year'],
          ]

  const handleListingTypeChange = (event) => {
    const nextType = event.target.value
    const nextPeriod =
      nextType === 'shortlet'
        ? 'night'
        : nextType === 'sale'
          ? 'total'
          : 'year'

    setListingType(nextType)
    setValue('listingType', nextType, { shouldValidate: true })
    setValue('pricePeriod', nextPeriod, { shouldValidate: true })
  }

  const handleFiles = (event) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFileError('')

    if (selectedFiles.length > 10) {
      setFiles([])
      setFileError('Select no more than 10 images.')
      return
    }

    const invalidType = selectedFiles.find(
      (file) => !imageTypes.includes(file.type),
    )
    if (invalidType) {
      setFiles([])
      setFileError('Every image must be a JPG, PNG, or WebP file.')
      return
    }

    const oversized = selectedFiles.find(
      (file) => file.size > 5 * 1024 * 1024,
    )
    if (oversized) {
      setFiles([])
      setFileError('Each image must not exceed 5 MB.')
      return
    }

    setFiles(selectedFiles)
  }

  const saveProperty = async (values, submissionAction) => {
    if (!isEdit && files.length === 0) {
      setFileError('Add at least one property image.')
      return
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          propertyId: property._id,
          values,
          files,
        })
        toast.success('Property changes saved')
      } else {
        await createMutation.mutateAsync({
          values: { ...values, submissionAction },
          files,
        })
        toast.success(
          submissionAction === 'draft'
            ? 'Property draft created'
            : 'Property submitted for review',
        )
      }

      navigate('/agent/properties')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to save property.'))
    }
  }

  const inputClass =
    'focus-ring mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm'
  const labelClass = 'block text-xs font-extrabold text-stone-600'

  return (
    <form
      onSubmit={handleSubmit((values) =>
        saveProperty(values, isEdit ? null : 'submit'),
      )}
      className="space-y-6"
    >
      <FormSection
        title="Listing essentials"
        description="Choose how this property will appear in the marketplace."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClass + ' sm:col-span-2'}>
            Property title
            <input
              {...register('title')}
              className={inputClass}
              placeholder="Modern three-bedroom apartment"
            />
            <FieldError error={errors.title} />
          </label>
          <label className={labelClass}>
            Listing type
            <select
              {...register('listingType')}
              onChange={handleListingTypeChange}
              className={inputClass}
            >
              <option value="rent">Long-term rent</option>
              <option value="sale">For sale</option>
              <option value="shortlet">Serviced shortlet</option>
            </select>
            <FieldError error={errors.listingType} />
          </label>
          <label className={labelClass}>
            Property type
            <select {...register('propertyType')} className={inputClass}>
              {propertyTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <FieldError error={errors.propertyType} />
          </label>
          <label className={labelClass}>
            Price
            <input
              type="number"
              min="1"
              step="any"
              {...register('price', numberInputOptions)}
              className={inputClass}
            />
            <FieldError error={errors.price} />
          </label>
          <label className={labelClass}>
            Currency
            <select {...register('currency')} className={inputClass}>
              <option value="NGN">NGN</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label className={labelClass}>
            Price period
            <select {...register('pricePeriod')} className={inputClass}>
              {pricePeriods.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <FieldError error={errors.pricePeriod} />
          </label>
          <label className={labelClass + ' sm:col-span-2'}>
            Description
            <textarea
              {...register('description')}
              rows={6}
              maxLength={5000}
              className="focus-ring mt-2 w-full resize-y rounded-xl border border-stone-300 p-3 text-sm font-normal"
              placeholder="Describe the property, its condition, surroundings, and important terms."
            />
            <FieldError error={errors.description} />
          </label>
        </div>
      </FormSection>

      <FormSection
        title="Location"
        description="Structured address fields power marketplace filters. Coordinates are optional and can be supplied by a map picker later."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClass + ' sm:col-span-2'}>
            Display location
            <input
              {...register('location')}
              className={inputClass}
              placeholder="Lekki Phase 1, Lagos"
            />
          </label>
          <label className={labelClass + ' sm:col-span-2'}>
            Street address
            <input {...register('streetAddress')} className={inputClass} />
          </label>
          <label className={labelClass}>
            City
            <input {...register('city')} className={inputClass} />
            <FieldError error={errors.city} />
          </label>
          <label className={labelClass}>
            State
            <input {...register('state')} className={inputClass} />
            <FieldError error={errors.state} />
          </label>
          <label className={labelClass}>
            LGA
            <input {...register('lga')} className={inputClass} />
          </label>
          <label className={labelClass}>
            Country
            <input {...register('country')} className={inputClass} />
            <FieldError error={errors.country} />
          </label>
          <label className={labelClass}>
            Postal code
            <input {...register('postalCode')} className={inputClass} />
          </label>
          <div />
          <label className={labelClass}>
            Latitude
            <input
              type="number"
              step="any"
              {...register('latitude', numberInputOptions)}
              className={inputClass}
            />
            <FieldError error={errors.latitude} />
          </label>
          <label className={labelClass}>
            Longitude
            <input
              type="number"
              step="any"
              {...register('longitude', numberInputOptions)}
              className={inputClass}
            />
            <FieldError error={errors.longitude} />
          </label>
        </div>
      </FormSection>

      <FormSection title="Property details">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['bedrooms', 'Bedrooms', 0],
            ['bathrooms', 'Bathrooms', 0],
            ['parkingSpaces', 'Parking spaces', 0],
          ].map(([name, label, minimum]) => (
            <label key={name} className={labelClass}>
              {label}
              <input
                type="number"
                min={minimum}
                {...register(name, numberInputOptions)}
                className={inputClass}
              />
              <FieldError error={errors[name]} />
            </label>
          ))}
          <label className={labelClass}>
            Furnishing
            <select {...register('furnishingStatus')} className={inputClass}>
              <option value="unfurnished">Unfurnished</option>
              <option value="semiFurnished">Semi-furnished</option>
              <option value="furnished">Furnished</option>
            </select>
          </label>
          <label className={labelClass}>
            Size
            <input
              type="number"
              min="0"
              step="any"
              {...register('sizeValue', numberInputOptions)}
              className={inputClass}
            />
            <FieldError error={errors.sizeValue} />
          </label>
          <label className={labelClass}>
            Size unit
            <select
              {...register('sizeUnit', {
                setValueAs: (value) => (value === '' ? undefined : value),
              })}
              className={inputClass}
            >
              <option value="">Not specified</option>
              <option value="sqm">Square metres</option>
              <option value="sqft">Square feet</option>
              <option value="acre">Acres</option>
              <option value="hectare">Hectares</option>
            </select>
          </label>
          <label className={labelClass}>
            Year built
            <input
              type="number"
              min="1800"
              max={maximumYearBuilt}
              {...register('yearBuilt', numberInputOptions)}
              className={inputClass}
            />
            <FieldError error={errors.yearBuilt} />
          </label>
          <label className={labelClass}>
            Service charge
            <input
              type="number"
              min="0"
              {...register('serviceCharge', numberInputOptions)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Security deposit
            <input
              type="number"
              min="0"
              {...register('securityDeposit', numberInputOptions)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Cleaning fee
            <input
              type="number"
              min="0"
              {...register('cleaningFee', numberInputOptions)}
              className={inputClass}
            />
          </label>
        </div>
      </FormSection>

      <FormSection title="Amenities">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {amenities.map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-3 text-sm font-semibold text-stone-700 hover:border-emerald-700"
            >
              <input
                type="checkbox"
                value={value}
                {...register('amenities')}
                className="size-4 accent-emerald-800"
              />
              {label}
            </label>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="Property images"
        description={
          isEdit
            ? 'Uploading new images replaces the current image set. Leave this empty to keep existing images.'
            : 'Upload 1–10 JPG, PNG, or WebP images. Each file can be up to 5 MB.'
        }
      >
        {isEdit && property.images?.length > 0 && (
          <div className="mb-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {property.images.map((image, index) => (
              <img
                key={image.public_id || image.url}
                src={image.url}
                alt={property.title + ' image ' + (index + 1)}
                className="aspect-square w-full rounded-xl object-cover"
              />
            ))}
          </div>
        )}
        <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center hover:border-emerald-700">
          <ImagePlus className="text-emerald-800" size={30} />
          <span className="mt-3 text-sm font-black text-stone-800">
            Choose property images
          </span>
          <span className="mt-1 text-xs text-stone-500">
            JPG, PNG, or WebP · maximum 5 MB each
          </span>
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleFiles}
            className="sr-only"
          />
        </label>
        {files.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs font-semibold text-stone-600">
            {files.map((file) => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        )}
        {fileError && (
          <p role="alert" className="mt-3 text-xs font-semibold text-red-700">
            {fileError}
          </p>
        )}
      </FormSection>

      <div className="flex flex-col justify-end gap-3 sm:flex-row">
        <Link
          to="/agent/properties"
          className="focus-ring rounded-xl border border-stone-300 bg-white px-5 py-3 text-center text-sm font-black text-stone-700"
        >
          Cancel
        </Link>
        {!isEdit && (
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSubmit((values) => saveProperty(values, 'draft'))}
            className="focus-ring flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-800 px-5 py-3 text-sm font-black text-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={17} /> Save draft
          </button>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="focus-ring flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : isEdit ? (
            <Save size={17} />
          ) : (
            <Send size={17} />
          )}
          {isSaving
            ? 'Saving property…'
            : isEdit
              ? 'Save changes'
              : 'Submit for review'}
        </button>
      </div>
    </form>
  )
}

function AgentPropertyFormPage() {
  const { propertyId } = useParams()
  const isEdit = Boolean(propertyId)
  const { data: property, error, isError, isLoading, refetch } =
    useAgentProperty(propertyId, isEdit)

  if (isEdit && isLoading) {
    return (
      <div className="h-96 animate-pulse rounded-2xl border border-stone-200 bg-white" />
    )
  }

  if (isEdit && isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertTriangle className="mx-auto text-red-700" size={28} />
        <p className="mt-3 text-sm font-semibold text-red-700">
          {getApiErrorMessage(error, 'Unable to load this property.')}
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

  return (
    <div>
      <Link
        to="/agent/properties"
        className="focus-ring mb-5 flex w-fit items-center gap-2 text-sm font-extrabold text-stone-600"
      >
        <ArrowLeft size={17} /> Back to properties
      </Link>
      <div className="mb-6">
        <p className="eyebrow">{isEdit ? 'Edit listing' : 'New listing'}</p>
        <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-stone-900">
          {isEdit ? property.title : 'Create a property'}
        </h2>
      </div>
      <PropertyEditor
        key={property?._id || 'new-property'}
        property={property}
      />
    </div>
  )
}

export default AgentPropertyFormPage
