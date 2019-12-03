const config = require('./config')
const minio = require('./minio')

const creds = config.credentials.minio

minio({
  ...creds
})
