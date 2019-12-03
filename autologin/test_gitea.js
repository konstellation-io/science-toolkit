const config = require('./config')
const gitea = require('./gitea')

const creds = config.credentials.gitea
gitea({
  ...creds
})
