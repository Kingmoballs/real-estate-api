import { expect, test } from '@playwright/test'
import { Buffer } from 'node:buffer'
import { installApiMock } from './fixtures/mockApi.js'

test('an approved agent can submit a property for review', async ({ page }) => {
  const state = await installApiMock(page, {
    user: {
      name: 'Ada Agent',
      email: 'ada.agent@example.com',
      role: 'agent',
    },
  })

  await page.goto('/agent/properties/new')
  await page.getByLabel('Property title').fill('New Victoria Island Apartment')
  await page.getByLabel('Price', { exact: true }).fill('7500000')
  await page
    .getByLabel('Description')
    .fill('A modern and secure apartment close to major business districts.')
  await page.getByLabel('Display location').fill('Victoria Island, Lagos')
  await page.getByLabel('City').fill('Lagos')
  await page.getByLabel('State').fill('Lagos')
  await page.locator('input[type="file"]').setInputFiles({
    name: 'property.png',
    mimeType: 'image/png',
    buffer: Buffer.from('e2e-property-image'),
  })

  await page.getByRole('button', { name: 'Submit for review' }).click()

  await expect(page).toHaveURL(/\/agent\/properties$/)
  expect(state.createdProperty).toBe(true)
  await expect(
    page.getByRole('heading', { name: 'My properties' }),
  ).toBeVisible()
})
