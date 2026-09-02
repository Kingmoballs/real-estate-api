import {
  describe,
  expect,
  it,
} from 'vitest'
import {
  agentApplicationSchema,
  applicationToFormValues,
  buildAgentApplicationPayload,
  normalizeServiceAreas,
} from './agentApplicationForm.js'

const validValues = {
  businessType: 'individual',
  businessName: 'Haven Realty',
  registrationNumber: '',
  yearsOfExperience: 5,
  serviceAreas:
    'Lekki, Victoria Island, Ikoyi',
  officeAddress:
    '10 Example Street, Lagos',
  bio: 'I help customers find verified residential properties across major areas of Lagos.',
}

describe('agent application form', () => {
  it('normalizes and removes duplicate service areas', () => {
    expect(
      normalizeServiceAreas(
        'Lekki, Ikoyi, lekki',
      ),
    ).toEqual([
      'Lekki',
      'Ikoyi',
    ])
  })

  it('accepts a valid individual application', () => {
    const result =
      agentApplicationSchema.safeParse(
        validValues,
      )

    expect(result.success).toBe(true)
  })

  it('requires a registration number for a company', () => {
    const result =
      agentApplicationSchema.safeParse({
        ...validValues,
        businessType: 'company',
        registrationNumber: '',
      })

    expect(result.success).toBe(false)

    expect(
      result.error.issues.some(
        (issue) =>
          issue.path[0] ===
          'registrationNumber',
      ),
    ).toBe(true)
  })

  it('builds the backend payload', () => {
    const payload =
      buildAgentApplicationPayload(
        validValues,
      )

    expect(payload).toEqual({
      businessType: 'individual',
      businessName:
        'Haven Realty',
      registrationNumber: null,
      yearsOfExperience: 5,
      serviceAreas: [
        'Lekki',
        'Victoria Island',
        'Ikoyi',
      ],
      officeAddress:
        '10 Example Street, Lagos',
      bio: validValues.bio,
    })
  })

  it('maps a rejected application back into the form', () => {
    const values =
      applicationToFormValues({
        businessType: 'company',
        businessName:
          'Example Properties Ltd',
        registrationNumber:
          'RC-12345',
        yearsOfExperience: 8,
        serviceAreas: [
          'Abuja',
          'Lagos',
        ],
        officeAddress:
          '20 Example Avenue',
        bio: validValues.bio,
      })

    expect(
      values.serviceAreas,
    ).toBe('Abuja, Lagos')

    expect(
      values.registrationNumber,
    ).toBe('RC-12345')
  })
})