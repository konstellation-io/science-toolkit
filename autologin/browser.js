const puppeteer = require('puppeteer')
const config = require('./config')

module.exports = async (url, loginFunction) => {
  const browser = await puppeteer.launch({
    headless: config.browser.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-notifications'
    ]
  })

  try {
    console.log(`Opening ${url}`)
    const page = await browser.newPage()
    await page.goto(url)
    const creds = await loginFunction(page)
    console.log(`Login for ${url} done.`)

    return creds
  } catch (err) {
    console.error(`Error running loginFunction: `, err)
    return {}
  } finally {
    console.log(`Closing ${url}`)
    await browser.close()
  }
}
