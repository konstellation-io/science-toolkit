const app = new Vue({
  el: '#app',
  data: {
    baseURL: '',
    input: {
      username: "",
      password: ""
    },
    services: {
      minio: { loggedIn: false },
      gitea: { loggedIn: false },
      jupyter: { loggedIn: false }
    }
  },
  created() {
    this.baseURL = new URL(window.location)
    window.addEventListener("message", this.updateStatus.bind(this), false)

    Object.keys(this.services).forEach(name => this.setIframeURL(name))
  },

  methods: {

    login: async function(event) {
      const response = await fetch('/login', {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(this.input)
      })
      const data = await response.json()

      Object.keys(data).map(component => {
        const creds = data[component]
        console.log('LOGIN: ', component, creds)
        this.setCredentials(component, creds)
      })
    },

    logout: function() {
      Object.keys(this.services).forEach(component => {
        const target = this.services[component]
        document.querySelector(`#${component}`).contentWindow.postMessage({ type: 'logout' }, target.url.origin)
      })

    },

    componentLogin: async function(component) {
      const response = await fetch(`/dev/login/${component}`, { method: 'POST' })
      const data = await response.json()
      console.log(`${component} LOGIN: `, data)

      this.setCredentials(component, data)
    },

    setIframeURL: function(component) {
      const url = new URL(this.baseURL)
      url.host = this.baseURL.host.replace(/^[^.]*\./, `${component}.`)
      url.pathname = "/listener/credentials.html"
      this.services[component].url = url
      this.services[component].src = url.href
    },

    setCredentials: function(component, credentials) {
      const target = this.services[component]
      const msg = { type: 'login', component, credentials }
      document.querySelector(`#${component}`).contentWindow.postMessage(msg, target.url.origin)
    },

    updateStatus: function(event) {
      console.log('MSG FROM IFRAME', event.data)
      const { component, loggedIn } = event.data
      if (component && this.services[component]) {
        this.services[component].loggedIn = loggedIn
      }
    }

  }
})

