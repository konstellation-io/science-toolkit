const runLogin = require('./browser.js')
const config = require('./config')

const DEFAULT_URL = config.services.jupyter

module.exports = async ({ url = DEFAULT_URL, user, pass }) => {
  if (!user || !pass) {
    console.log('NO CREDENTIALS')
    return {}
  }

  return runLogin(url, async (page) => {
    const usernameField = await page.$('input#username_input')
    await usernameField.click()
    await usernameField.type(user)
    await usernameField.dispose()

    const passwordField = await page.$('input#password_input')
    await passwordField.click()
    await passwordField.type(pass)
    await passwordField.dispose()

    await page.waitFor(100)
    await Promise.all([
      page.click('input#login_submit'),
      page.waitForNavigation()
    ])

    let cookies = await page.cookies()
    console.log('JUPYTER COOKIES: ', cookies)

    // This is needed to remove extra quotes on some cookies
    cookies = cookies.map(cookie => {
      if (cookie.value.match(/^".*"$/)) {
        cookie.value = cookie.value.replace(/^"(.*)"$/, '$1')
      }
      return cookie
    })

    return cookies
  })
}

