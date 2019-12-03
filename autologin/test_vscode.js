const config = require('./config')
const vscode = require('./vscode')
const creds = config.credentials.code

vscode({
  ...creds
})
