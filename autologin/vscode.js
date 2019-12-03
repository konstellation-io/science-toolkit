const runLogin = require('./browser.js')
const config = require('./config')

const DEFAULT_URL = config.services.code

module.exports = ({ url = DEFAULT_URL, password }) => {
  if (!password) {
    console.log('NO CREDENTIALS')
    return {}
  }

  return runLogin(url, async (page) => {
    const usernameField = await page.$('input[name=password]')
    await usernameField.click()
    await usernameField.type(password)
    await usernameField.dispose()

    await page.waitFor(1000)
    await Promise.all([
      page.click('form.login-form > .button'),
      page.waitForNavigation()
    ])

    let cookie = await page.cookies()
    console.log('VS CODE COOKIES: ', cookie)

    return cookie
  })
}
