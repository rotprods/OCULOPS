import { test as setup } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUTH_FILE = path.join(__dirname, '.auth/user.json')

setup('authenticate', async ({ page }) => {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD

  if (!email || !password) {
    console.warn('[auth.setup] PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD not set — skipping')
    // Save empty state so dependent tests don't fail on missing file
    await page.context().storageState({ path: AUTH_FILE })
    return
  }

  await page.goto('/')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.locator('button[type="submit"]').click()

  // Wait for redirect to app after successful login
  await page.waitForURL('**/control-tower', { timeout: 20000 })

  await page.context().storageState({ path: AUTH_FILE })
})
