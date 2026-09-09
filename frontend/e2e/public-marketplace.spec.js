import { expect, test } from '@playwright/test'
import { installApiMock } from './fixtures/mockApi.js'

test('a visitor can discover and search the marketplace', async ({ page }) => {
  await installApiMock(page)
  await page.goto('/')

  await expect(
    page.getByRole('heading', {
      name: 'Find a place that fits the way you want to live.',
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Places worth seeing' }),
  ).toBeVisible()
  await expect(page.locator('main article')).toHaveCount(4)

  await page.getByPlaceholder('Try Lekki, Abuja, or Port Harcourt').fill('Lekki')
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(page).toHaveURL(/\/properties\?listingType=rent&search=Lekki/)
  await expect(
    page.getByRole('heading', { name: 'Find your next place' }),
  ).toBeVisible()
})
