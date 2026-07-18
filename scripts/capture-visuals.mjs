import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseURL = process.env.CALC_URL || 'http://127.0.0.1:4173'
const auditDirectory = resolve(process.env.CALC_AUDIT_DIR || 'test-results/visual-audit')
const docsDirectory = resolve('docs')
await mkdir(auditDirectory, { recursive: true })
await mkdir(docsDirectory, { recursive: true })
const browser = await chromium.launch()
const scenarios = [
  { name: 'calculate-desktop', width: 1440, height: 900, mode: 'calculate', docs: 'calc-v2-calculate.png' },
  { name: 'graph-desktop', width: 1440, height: 900, mode: 'graph', docs: 'calc-v2-graph.png' },
  { name: 'convert-desktop', width: 1366, height: 768, mode: 'convert', docs: 'calc-v2-convert.png' },
  { name: 'compact-1024', width: 1024, height: 768, mode: 'calculate' },
  { name: 'tablet-portrait', width: 768, height: 1024, mode: 'lab' },
  { name: 'phone-390', width: 390, height: 844, mode: 'calculate', docs: 'calc-v2-mobile.png' },
  { name: 'phone-360', width: 360, height: 800, mode: 'graph' },
]
const report = []
for (const scenario of scenarios) {
  const context = await browser.newContext({ viewport: { width: scenario.width, height: scenario.height }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${baseURL}/#mode=${scenario.mode}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(250)
  const metrics = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: innerWidth,
    bodyHeight: document.body.scrollHeight,
    minimumPrimaryKeyHeight: Math.min(...[...document.querySelectorAll('.primary-keypad button')].map((item) => item.getBoundingClientRect().height), 999),
  }))
  const target = resolve(auditDirectory, `${scenario.name}-${scenario.width}x${scenario.height}.png`)
  await page.screenshot({ path: target, fullPage: false })
  if (scenario.docs) await page.screenshot({ path: resolve(docsDirectory, scenario.docs), fullPage: false })
  report.push({ ...scenario, ...metrics, errors })
  await context.close()
}
await browser.close()
await writeFile(resolve(auditDirectory, 'report.json'), JSON.stringify(report, null, 2))
if (report.some((item) => item.errors.length || item.documentWidth > item.viewportWidth || (item.mode === 'calculate' && item.minimumPrimaryKeyHeight < 44))) {
  console.error(JSON.stringify(report, null, 2))
  process.exitCode = 1
} else console.log(JSON.stringify(report, null, 2))
