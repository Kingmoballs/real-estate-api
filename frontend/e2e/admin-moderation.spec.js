import { expect, test } from '@playwright/test'
import { installApiMock, propertyId } from './fixtures/mockApi.js'

test('an administrator can approve a pending property', async ({ page }) => {
  const state = await installApiMock(page, {
    user: {
      name: 'Haven Administrator',
      email: 'admin@example.com',
      role: 'admin',
    },
    propertyOverrides: { listingStatus: 'pendingReview' },
  })

  await page.goto(`/admin/properties/${propertyId}`)
  await expect(
    page.getByRole('heading', { name: 'Waterfront Apartment in Lekki' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Approve property' }).click()
  await page.getByRole('button', { name: 'Approve and publish' }).click()

  await expect(page).toHaveURL(/\/admin\/properties$/)
  expect(state.approvedProperty).toBe(true)
  await expect(
    page.getByRole('heading', { name: 'Property reviews' }),
  ).toBeVisible()
})
