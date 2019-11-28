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
    page = await browser.newPage()
    await page.goto(url)
    return await loginFunction(page)
  } catch (err) {
    console.error(`Error running loginFunction: `, err)
    return {}
  } finally {
    console.log(`Closing ${url}`)
    await browser.close()
  }
}

