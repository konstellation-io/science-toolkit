const config = require('./config')
const jupyter = require('./jupyter')

const creds = config.credentials.jupyter
jupyter({
  ...creds
})
