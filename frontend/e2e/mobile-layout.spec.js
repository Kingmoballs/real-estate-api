import { expect, test } from '@playwright/test'
import {
  conversationId,
  installApiMock,
  propertyId,
} from './fixtures/mockApi.js'

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
})

test.describe.configure({ timeout: 120_000 })

const users = {
  customer: {
    _id: '66aa11bb22cc33dd44ee5520',
    name: 'Tola Customer',
    email: 'tola.customer@example.com',
    phone: '+2348012345678',
    role: 'user',
  },
  agent: {
    _id: '66aa11bb22cc33dd44ee5510',
    name: 'Ada Agent',
    email: 'ada.agent@example.com',
    phone: '+2348098765432',
    role: 'agent',
  },
  admin: {
    _id: '66aa11bb22cc33dd44ee5500',
    name: 'Haven Admin',
    email: 'admin@haven.example.com',
    role: 'admin',
  },
}

const routeName = (route) =>
  (route === '/' ? 'home' : route)
    .replace(/^\//, '')
    .replace(/[/?=&:]+/g, '-')

async function auditRoutes(page, routes) {
  for (const route of routes) {
    await page.goto(route)
    await expect(page.locator('body')).toBeVisible()
    await page
      .getByText('Checking your session...')
      .waitFor({ state: 'hidden', timeout: 15_000 })
      .catch(() => undefined)
    await page.waitForTimeout(400)
    await expect(
      page.getByRole('heading', { name: 'Something went wrong' }),
    ).toHaveCount(0)

    const viewport = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }))

    expect.soft(
      viewport.documentWidth,
      `${route} must not overflow the mobile viewport`,
    ).toBeLessThanOrEqual(viewport.viewportWidth + 1)

    await page.screenshot({
      path: `test-results/mobile-audit/${routeName(route)}.png`,
      fullPage: false,
    })
  }
}

test('public marketplace routes fit a mobile viewport', async ({ page }) => {
  await installApiMock(page, { includeActivity: true })

  await auditRoutes(page, [
    '/',
    '/properties',
    `/properties/${propertyId}`,
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/page-that-does-not-exist',
  ])
})

test('customer routes fit a mobile viewport', async ({ page }) => {
  await installApiMock(page, {
    user: users.customer,
    includeActivity: true,
  })

  await auditRoutes(page, [
    '/account',
    '/account?tab=inspections',
    '/account?tab=reviews',
    '/bookings',
    '/messages',
    `/messages/${conversationId}`,
    '/agent-application',
    '/account/security',
  ])
})

test('agent workspace routes fit a mobile viewport', async ({ page }) => {
  await installApiMock(page, {
    user: users.agent,
    includeActivity: true,
  })

  await auditRoutes(page, [
    '/agent',
    '/agent/properties',
    '/agent/properties/new',
    `/agent/properties/${propertyId}/edit`,
    '/agent/inspections',
    '/agent/bookings',
    '/agent/reviews',
    '/messages',
    `/messages/${conversationId}`,
  ])
})

test('admin workspace routes fit a mobile viewport', async ({ page }) => {
  await installApiMock(page, {
    user: users.admin,
    includeActivity: true,
  })

  await auditRoutes(page, [
    '/admin',
    '/admin/properties',
    `/admin/properties/${propertyId}`,
    '/admin/reviews',
    '/admin/inspections',
    '/admin/bookings',
  ])
})
