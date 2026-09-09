import { expect, test } from '@playwright/test'
import { installApiMock } from './fixtures/mockApi.js'

test('a visitor can register and then log in', async ({ page }) => {
  const state = await installApiMock(page)
  await page.goto('/register')

  await page.getByLabel('Full name').fill('Tola Customer')
  await page.getByLabel('Phone number').fill('+2348012345678')
  await page.getByLabel('Email address').fill('tola@example.com')
  await page.getByLabel('Password').fill('StrongPass!123')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page).toHaveURL(/\/login$/)
  expect(state.registered).toBe(true)

  const loginForm = page.locator('form')
  const emailInput = loginForm.locator('input[name="email"]')
  const passwordInput = loginForm.locator('input[name="password"]')

  await expect(
    page.getByRole('heading', { name: 'Log in to Haven' }),
  ).toBeVisible()
  await emailInput.fill('tola@example.com')
  await passwordInput.fill('StrongPass!123')
  await expect(emailInput).toHaveValue('tola@example.com')
  await expect(passwordInput).toHaveValue('StrongPass!123')
  await loginForm.getByRole('button', { name: 'Log in' }).click()

  await expect(page).toHaveURL(/\/account$/)
  await expect(
    page.getByRole('heading', { name: 'Welcome, Tola' }),
  ).toBeVisible()
})
