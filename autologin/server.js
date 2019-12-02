const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')

const minio = require('./minio')
const gitea = require('./gitea')
const jupyter = require('./jupyter')
const config = require('./config')

const PORT = config.server.port
const credentials = config.credentials
const basicCredentials = config.credentials.basic

const loginRunners = { minio, gitea, jupyter }
const logErr = err => console.log(`AUTOLOGIN ERROR: `, err)

const app = express()
app.use(bodyParser.json())
app.use(express.static('public'))

app.post('/login', async function (req, res) {
  const user = req.body.username
  const pass = req.body.password

  // TODO: Validate with a user list from DB
  if (req.body.username !== basicCredentials.user || req.body.password !== basicCredentials.pass) {
    console.error('Unauthorized access')
    res.status(401).json({
      code: 401,
      message: "Invalid username or password"
    })
    return
  }

  components = Object.keys(loginRunners)

  loginReq = components.map(component => {
    const loginFunction = loginRunners[component]
    const creds = credentials[component]
    return loginFunction(creds).catch(logErr)
  })

  const loginRes = await Promise.all(loginReq)

  const data = loginRes.reduce((obj, curr, idx) => {
    obj[components[idx]] = curr
    return obj
  }, {})

  console.log(`AUTOLOGIN OK`, data)
	res.json(data)
})

// Development endpoints to test each component separetly
app.post('/dev/login/:component', async function (req, res) {
  const component = req.params.component

  const runner = loginRunners[component]
  const creds = credentials[component]

  if (runner) {
    data = await runner(creds)
  }

  console.log(`${component} LOGIN`, data)
	res.json(data)
})

app.listen(PORT, function () {
  console.log(`App listening on port ${PORT}!`)
})

