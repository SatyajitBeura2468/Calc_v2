import { expect, test } from '@playwright/test'

test('10-12. phone and tablet layouts remain usable without page overflow', async ({ page }, testInfo) => {
  await page.goto('/')
  const size = page.viewportSize()!
  expect([390, 1024]).toContain(size.width)
  await expect(page.getByLabel('Calculation expression')).toBeVisible()
  await expect(page.locator('.primary-keypad')).toBeVisible()
  await expect(page.locator('.primary-keypad > button')).toHaveCount(24)
  const metrics = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth, minimumKey: Math.min(...[...document.querySelectorAll<HTMLElement>('.primary-keypad button')].map((item) => item.getBoundingClientRect().height)) }))
  expect(metrics.document).toBeLessThanOrEqual(metrics.viewport)
  expect(metrics.minimumKey).toBeGreaterThanOrEqual(size.width < 500 ? 44 : 48)
  await page.getByRole('button', { name: 'Graph', exact: true }).click()
  await expect(page.locator('.graph-canvas-wrap canvas')).toBeVisible()
  await page.screenshot({ path: `test-results/${testInfo.project.name}-${size.width}x${size.height}.png`, fullPage: false })
})

test('13. long expressions and results stay within a phone or tablet viewport', async ({ page }) => {
  await page.goto('/')
  const editor = page.getByLabel('Calculation expression')
  await editor.fill('12345678901234567890 + 98765432109876543210')
  await expect(page.locator('.result-panel')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})
