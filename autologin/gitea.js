const runLogin = require('./browser.js')
const config = require('./config')

const DEFAULT_URL = config.services.gitea

module.exports = async ({ url = DEFAULT_URL, user, pass }) => {
  if (!user || !pass) {
    console.log('NO CREDENTIALS')
    return {}
  }

  return runLogin(url, async (page) => {
    const usernameField = await page.$('input#user_name')
    await usernameField.click()
    await usernameField.type(user)
    await usernameField.dispose()

    const passwordField = await page.$('input#password')
    await passwordField.click()
    await passwordField.type(pass)
    await passwordField.dispose()

    const rememberCheck = await page.$('input[name=remember]')
    await rememberCheck.click()
    await rememberCheck.dispose()

    await page.waitFor(500)
    await Promise.all([
      page.click('form.form button'),
      page.waitForNavigation()
    ])

    let cookie = await page.cookies()
    console.log('GITEA COOKIES: ', cookie)

    return cookie
  })
}

