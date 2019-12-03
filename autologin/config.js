module.exports = {
  server: {
    port: process.env.PORT || 3000
  },
  browser: {
    headless: process.env.HEADLESS_BROWSER === "0" ? false : true,
  },
  services: {
    code: process.env.VSCODE_LOGIN_URL || 'http://vscode:8080/login',
    minio: process.env.MINIO_LOGIN_URL || 'http://minio/minio/login',
    gitea: process.env.GITEA_LOGIN_URL || 'http://gitea-gitea-http:3000/user/login',
    jupyter: process.env.JUPYTER_LOGIN_URL || 'http://proxy-public/hub/login'
  },
  credentials: {
    basic: {
      user: process.env.AUTOLOGIN_USERNAME || 'test',
      pass: process.env.AUTOLOGIN_PASSWORD || 'test'
    },
    code: {
      password: process.env.VSCODE_PASSWORD || '123456'
    },
    minio: {
      accessKey: process.env.MINIO_ACCESS_KEY || 'minio',
      secretKey: process.env.MINIO_SECRET_KEY || 'minio123'
    },
    gitea: {
      user: process.env.GITEA_USERNAME || 'test',
      pass: process.env.GITEA_PASSWORD || 'gitea123'
    },
    jupyter: {
      user: process.env.JUPYTER_USERNAME || 'test',
      pass: process.env.JUPYTER_PASSWORD || 'test'
    }
  }
}
