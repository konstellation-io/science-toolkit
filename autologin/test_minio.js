const minio = require('./minio')

minio({
  url: 'http://minio.toolkit.local/minio/login',
  accessKey: 'minio',
  secretKey: 'minio123'
})

