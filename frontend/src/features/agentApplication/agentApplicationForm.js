import { z } from 'zod'

export const normalizeServiceAreas = (
  value = '',
) => {
  const uniqueAreas = new Map()

  value
    .split(/[,\n]/)
    .map((area) => area.trim())
    .filter(Boolean)
    .forEach((area) => {
      const normalizedKey =
        area.toLowerCase()

      if (
        !uniqueAreas.has(
          normalizedKey,
        )
      ) {
        uniqueAreas.set(
          normalizedKey,
          area,
        )
      }
    })

  return [
    ...uniqueAreas.values(),
  ]
}

export const agentApplicationSchema =
  z
    .object({
      businessType: z.enum(
        ['individual', 'company'],
        {
          message:
            'Select a business type',
        },
      ),

      businessName: z
        .string()
        .trim()
        .min(
          2,
          'Business name must contain at least 2 characters',
        )
        .max(
          150,
          'Business name cannot exceed 150 characters',
        ),

      registrationNumber: z
        .string()
        .trim()
        .max(
          100,
          'Registration number cannot exceed 100 characters',
        ),

      yearsOfExperience: z.coerce
        .number({
          message:
            'Enter your years of experience',
        })
        .int(
          'Years of experience must be a whole number',
        )
        .min(
          0,
          'Years of experience cannot be negative',
        )
        .max(
          70,
          'Years of experience cannot exceed 70',
        ),

      serviceAreas: z
        .string()
        .trim()
        .min(
          2,
          'Enter at least one service area',
        ),

      officeAddress: z
        .string()
        .trim()
        .min(
          5,
          'Office address must contain at least 5 characters',
        )
        .max(
          300,
          'Office address cannot exceed 300 characters',
        ),

      bio: z
        .string()
        .trim()
        .min(
          30,
          'Your professional description must contain at least 30 characters',
        )
        .max(
          1000,
          'Your professional description cannot exceed 1000 characters',
        ),
    })
    .superRefine(
      (
        {
          businessType,
          registrationNumber,
          serviceAreas,
        },
        context,
      ) => {
        if (
          businessType ===
            'company' &&
          registrationNumber.length < 2
        ) {
          context.addIssue({
            code: 'custom',
            path: [
              'registrationNumber',
            ],
            message:
              'Company registration number is required',
          })
        }

        const normalizedAreas =
          normalizeServiceAreas(
            serviceAreas,
          )

        if (
          normalizedAreas.length < 1
        ) {
          context.addIssue({
            code: 'custom',
            path: ['serviceAreas'],
            message:
              'Enter at least one service area',
          })
        }

        if (
          normalizedAreas.length > 20
        ) {
          context.addIssue({
            code: 'custom',
            path: ['serviceAreas'],
            message:
              'You can provide a maximum of 20 service areas',
          })
        }

        const invalidArea =
          normalizedAreas.find(
            (area) =>
              area.length < 2 ||
              area.length > 100,
          )

        if (invalidArea) {
          context.addIssue({
            code: 'custom',
            path: ['serviceAreas'],
            message:
              'Each service area must contain between 2 and 100 characters',
          })
        }
      },
    )

export const emptyAgentApplicationValues =
  {
    businessType: 'individual',
    businessName: '',
    registrationNumber: '',
    yearsOfExperience: 0,
    serviceAreas: '',
    officeAddress: '',
    bio: '',
  }

export const applicationToFormValues = (
  application,
) => ({
  businessType:
    application?.businessType ||
    'individual',

  businessName:
    application?.businessName ||
    '',

  registrationNumber:
    application?.registrationNumber ||
    '',

  yearsOfExperience:
    application
      ?.yearsOfExperience ?? 0,

  serviceAreas:
    application?.serviceAreas?.join(
      ', ',
    ) || '',

  officeAddress:
    application?.officeAddress ||
    '',

  bio: application?.bio || '',
})

export const buildAgentApplicationPayload =
  (values) => ({
    businessType:
      values.businessType,

    businessName:
      values.businessName.trim(),

    registrationNumber:
      values.businessType ===
      'company'
        ? values.registrationNumber.trim()
        : null,

    yearsOfExperience: Number(
      values.yearsOfExperience,
    ),

    serviceAreas:
      normalizeServiceAreas(
        values.serviceAreas,
      ),

    officeAddress:
      values.officeAddress.trim(),

    bio: values.bio.trim(),
  })