const runLogin = require('./browser.js')
const config = require('./config')

const DEFAULT_URL = config.services.minio

module.exports = ({ url = DEFAULT_URL, accessKey, secretKey }) => {
  if (!accessKey || !secretKey) {
    console.log('NO CREDENTIALS')
    return {}
  }

  return runLogin(url, async (page) => {
    const accessKeyField = await page.$('input#accessKey')
    await accessKeyField.click()
    await accessKeyField.type(accessKey)
    await accessKeyField.dispose()

    const secretKeyField = await page.$('input#secretKey')
    await secretKeyField.click()
    await secretKeyField.type(secretKey)
    await secretKeyField.dispose()

    await page.waitFor(1000)
    await page.waitForSelector('.login > .l-wrap > form > .lw-btn > .fa')
    await page.click('button.lw-btn > .fa')
    await page.waitForNavigation()

    const data = await page.evaluate(() => {
      let json = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        json[key] = localStorage.getItem(key)
      }
      return json
    })
    console.log('MINIO LOCALSTORAGE: ', data)

    return data
  })
}
