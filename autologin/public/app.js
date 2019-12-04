
Vue.use(VueMaterial.default)
const app = new Vue({
  el: '#app',
  data: {
    baseURL: '',
    isLoading: false,
    input: {
      username: "",
      password: ""
    },
    services: {
      code: {
        loggedIn: false,
        img: "/img/vscode.png",
        iframe: true
      },
      minio: {
        loggedIn: false,
        img: "/img/minio.png",
        iframe: true
      },
      gitea: {
        loggedIn: false,
        img: "/img/gitea.png",
        iframe: true
      },
      jupyter: {
        loggedIn: false,
        img: "/img/jupyter.png",
        iframe: true
      },
      drone: {
        loggedIn: false,
        img: "/img/drone.png",
        iframe: false
      }
    }
  },
  created() {
    this.baseURL = new URL(window.location)
    window.addEventListener("message", this.updateStatus.bind(this), false)

    Object.keys(this.services).forEach(name => this.setIframeURL(name))
  },

  methods: {

    login: async function (event) {
      this.isLoading = true
      const response = await fetch('/login', {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(this.input)
      })
      const data = await response.json()
      this.isLoading = false
      Object.keys(data).map(component => {
        const creds = data[component]
        console.log('LOGIN: ', component, creds)
        this.setCredentials(component, creds)
        // Jupyterhub needs to open with extra path same as the cookie path
        if (component === 'jupyter') {
          const userCookie = creds.filter(key => key.name.match(/^jupyterhub-user/))[0]
          this.services.jupyter.extraPath = userCookie.path
        }
      })
    },

    logout: function () {
      Object.keys(this.services).forEach(component => {
        const target = this.services[component]
        document.querySelector(`#${component}`).contentWindow.postMessage({ type: 'logout' }, target.url.origin)
      })

      // remove extra path for Jupyter
      this.services.jupyter.extraPath = ''

    },

    openComponent: function (name, service) {
      const url = `${service.url.origin}${service.extraPath || ''}`
      console.log(`Opening service ${name}: ${url}`)
      window.open(url, name)
    },

    componentLogin: async function (component) {
      const response = await fetch(`/dev/login/${component}`, { method: 'POST' })
      const data = await response.json()
      console.log(`${component} LOGIN: `, data)

      this.setCredentials(component, data)
    },

    setIframeURL: function (component) {
      const url = new URL(this.baseURL)
      url.host = this.baseURL.host.replace(/^[^.]*\./, `${component}.`)
      url.pathname = "/listener/credentials.html"
      this.services[component].url = url
      if (!this.services[component].iframe) {
        return
      }
      this.services[component].iframeSrc = url.href
    },

    setCredentials: function (component, credentials) {
      const target = this.services[component]
      const msg = { type: 'login', component, credentials }
      document.querySelector(`#${component}`).contentWindow.postMessage(msg, target.url.origin)
    },

    updateStatus: function (event) {
      console.log('MSG FROM IFRAME', event.data)
      const { component, loggedIn } = event.data
      if (component && this.services[component]) {
        this.services[component].loggedIn = loggedIn

        // Drone shares login with gitea by OAuth token
        if (component === 'gitea') {
          this.services['drone'].loggedIn = loggedIn
        }
      }
    }

  }
})
