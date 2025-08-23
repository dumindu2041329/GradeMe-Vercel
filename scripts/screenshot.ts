import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer'

async function ensureDir(dir: string) {
	await fs.promises.mkdir(dir, { recursive: true })
}

async function waitForServer(url: string, timeoutMs = 60000) {
	const start = Date.now()
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await fetch(url, { method: 'GET' })
			if (res.ok) return
		} catch {}
		await new Promise((r) => setTimeout(r, 500))
	}
	throw new Error(`Server not reachable at ${url} within ${timeoutMs}ms`)
}

async function capture() {
	const outDir = path.join(process.cwd(), 'docs', 'screenshots')
	await ensureDir(outDir)

	const baseUrl = process.env.SCREENSHOT_BASE_URL || 'http://localhost:5000'
	await waitForServer(baseUrl)

	const browser = await puppeteer.launch({
		headless: 'new',
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	})
	const page = await browser.newPage()

	// Desktop 1440p
	await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })

	// Landing
	await page.goto(baseUrl + '/', { waitUntil: 'networkidle0' })
	await page.waitForSelector('main')
	await new Promise((r) => setTimeout(r, 1500))
	await page.screenshot({ path: path.join(outDir, 'landing-desktop.png'), fullPage: true })

	// Scroll a bit for features section
	await page.evaluate(() => window.scrollBy({ top: window.innerHeight, behavior: 'instant' as any }))
	await new Promise((r) => setTimeout(r, 800))
	await page.screenshot({ path: path.join(outDir, 'landing-features-desktop.png'), fullPage: false })

	// Mobile viewport
	await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 })
	await page.goto(baseUrl + '/', { waitUntil: 'networkidle0' })
	await page.waitForSelector('main')
	await new Promise((r) => setTimeout(r, 1200))
	await page.screenshot({ path: path.join(outDir, 'landing-mobile.png'), fullPage: true })

	await browser.close()
	console.log('Screenshots saved to', outDir)
}

capture().catch((err) => {
	console.error(err)
	process.exit(1)
})
