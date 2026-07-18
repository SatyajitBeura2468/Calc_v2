import { expect, test, type Page } from '@playwright/test'

async function clean(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
}

test.beforeEach(async ({ page }) => { await clean(page) })

test('1. enter a calculation and receive a committed result', async ({ page }) => {
  const editor = page.getByLabel('Calculation expression')
  await editor.fill('2 + 3 * 4')
  await editor.press('Enter')
  await expect(page.locator('.result-panel output')).toHaveText('14')
  await page.locator('.desktop-history').click()
  await expect(page.locator('.recall-entry span')).toContainText('2 + 3 * 4')
})

test('2. scientific keypad, caret insertion, angle mode, and memory work', async ({ page }) => {
  const editor = page.getByLabel('Calculation expression')
  await editor.fill('12+34')
  await editor.evaluate((node: HTMLTextAreaElement) => node.setSelectionRange(2, 2))
  await page.getByRole('button', { name: '9', exact: true }).click()
  await expect(editor).toHaveValue('129+34')
  await editor.fill('sin(30)')
  await expect(page.locator('.result-panel output')).toHaveText('0.5')
  await page.getByLabel('Angle mode').selectOption('RAD')
  await expect(page.locator('.result-panel output')).not.toHaveText('0.5')
  await page.getByLabel('Angle mode').selectOption('GRAD')
  await editor.fill('sin(100)')
  await expect(page.locator('.result-panel output')).toHaveText('1')
  await page.getByRole('button', { name: 'M+', exact: true }).click()
  await expect(page.getByText('M 1')).toBeVisible()
})

test('3. create, switch, recall, and persist a workspace', async ({ page }) => {
  await page.locator('.desktop-history').click()
  await page.getByRole('button', { name: /New/ }).click()
  await expect(page.locator('.workspace-tabs')).toContainText('Workspace 2')
  await page.getByLabel('Close history').click()
  await page.getByLabel('Calculation expression').fill('9^2')
  await page.getByLabel('Calculation expression').press('Enter')
  await page.reload()
  await expect(page.locator('.app-footer')).toContainText('Workspace 2')
  await page.locator('.desktop-history').click()
  await expect(page.locator('.recall-entry span')).toContainText('9^2')
  await page.locator('.recall-entry').click()
  await expect(page.getByLabel('Calculation expression')).toHaveValue('9^2')
})

test('4. graph visible controls edit graph state, zoom, pan, and reset', async ({ page }) => {
  await page.getByRole('button', { name: 'Graph', exact: true }).click()
  const first = page.getByLabel('Function 1 expression')
  await first.fill('')
  await page.locator('.graph-keypad').getByRole('button', { name: 'x', exact: true }).click()
  await expect(first).toHaveValue('x')
  await page.getByLabel('Add function').click()
  await expect(page.locator('.function-row')).toHaveCount(4)
  const canvas = page.locator('.graph-canvas-wrap canvas')
  const before = await page.getByLabel('Visible graph range').locator('input').first().inputValue()
  await canvas.hover({ position: { x: 400, y: 250 } })
  await page.mouse.wheel(0, -400)
  await expect.poll(() => page.getByLabel('Visible graph range').locator('input').first().inputValue()).not.toBe(before)
  const box = await canvas.boundingBox(); if (box) { await page.mouse.move(box.x + 450, box.y + 300); await page.mouse.down(); await page.mouse.move(box.x + 500, box.y + 320); await page.mouse.up() }
  await page.getByRole('button', { name: /Reset/ }).click()
  await expect(page.getByLabel('Visible graph range').locator('input').first()).toHaveValue(/-6\.283/)
})

test('5. converter supports two editable sides, swap, and validation', async ({ page }) => {
  await page.getByRole('button', { name: 'Convert', exact: true }).click()
  await page.getByLabel('Value in Metre').fill('1000')
  await expect(page.getByLabel('Value in Kilometre')).toHaveValue('1')
  await page.getByLabel('Swap units').click()
  await expect(page.getByLabel('Source unit')).toHaveValue('km')
  await page.getByRole('button', { name: /Temperature/ }).click()
  await page.getByLabel('Source unit').selectOption('k')
  await page.getByLabel('Value in Kelvin').fill('-1')
  await expect(page.getByRole('alert')).toContainText('absolute zero')
})

test('6. command palette keyboard navigation executes commands', async ({ page }) => {
  await page.keyboard.press('Control+K')
  const search = page.getByPlaceholder(/Type a command/)
  await search.fill('open lab')
  await search.press('ArrowDown')
  await search.press('ArrowUp')
  await search.press('Enter')
  await expect(page.getByRole('button', { name: 'Lab', exact: true })).toHaveClass(/active/)
})

test('7. Lab tools are usable, not placeholder tabs', async ({ page }) => {
  await page.getByRole('button', { name: 'Lab', exact: true }).click()
  await expect(page.locator('.solution-panel')).toContainText('x = 2')
  await page.getByRole('button', { name: /Matrix workspace/ }).click()
  await page.getByRole('button', { name: 'det(A)' }).click()
  await expect(page.locator('.matrix-result')).toContainText('det(A) = -2')
  await page.getByRole('button', { name: /Statistics/ }).click()
  await expect(page.locator('.stat-grid')).toContainText('Mean')
  await page.getByRole('button', { name: /Programmer/ }).click()
  await expect(page.locator('.representation-list')).toContainText('0010 1010')
})

test('8. settings and theme persist after reload', async ({ page }) => {
  await page.getByLabel('Open settings').click()
  await page.getByRole('button', { name: /Paper/ }).click()
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper')
})

test('9. primary controls have actions and the console stays clean', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.getByRole('button', { name: 'Graph', exact: true }).click()
  await page.getByRole('button', { name: 'Convert', exact: true }).click()
  await page.getByRole('button', { name: 'Lab', exact: true }).click()
  await page.getByRole('button', { name: 'Calculate', exact: true }).click()
  await page.getByLabel('Open settings').click(); await page.getByRole('button', { name: 'Done' }).click()
  await page.getByLabel('Open command palette').click(); await page.keyboard.press('Escape')
  await expect.poll(() => errors).toEqual([])
})
