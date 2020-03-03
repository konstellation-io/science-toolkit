// Get a domain info to build our urls
const {protocol, hostname, port} = location
const app = new Vue({
    el: '#app',
    data() {
        return {
            baseURL: new URL(window.location),
            error: null,
            username: "",
            codeServer: {
                status: false,
                isRunning: false,
                isLoading: false,
            },
            services: [
                {name: "drone", label: "Drone CI"},
                {name: "gitea", label: "Gitea"},
                {name: "jupyter", label: "Jupyter Notebooks"},
                {name: "vscode", label: "VS Code"},
                {name: "minio", label: "Minio"},
                {name: "mlflow", label: "ML Flow"},
            ]
        }
    },
    created: async function () {

        this.statusCodeServer()
    },
    computed: {
        canStart() {
            return this.codeServer.status && !this.codeServer.isRunning
        },
        canStop() {
            return this.codeServer.status && this.codeServer.isRunning
        }
    },
    methods: {
        isDisabled(name) {
            if (name !== "vscode") {
                return false
            }
            return this.codeServer.status && !this.codeServer.isRunning
        },
        async statusCodeServer() {
            const res = await axios.get(`/api/status`)

            this.codeServer.status = true
            this.codeServer.isRunning = res.data.running
            this.username = res.headers['x-forwarded-user']
        },
        async startCodeServer() {
            this.error = null
            this.codeServer.isLoading = true
            try {
                await axios.post(`/api/start`)
            }catch (e) {
                this.error = e
                console.log("Error: ",e)
            }finally {
                this.statusCodeServer()
                this.codeServer.isLoading = false
            }

        },
        async stopCodeServer() {
            this.error = null
            this.codeServer.isLoading = true
            try {
                await axios.post(`/api/stop`)
            }catch (e) {
                this.error = e
                console.log("Error: ",e)
            }finally {
                setTimeout(() => {
                    this.statusCodeServer()
                    this.codeServer.isLoading = false
                }, 3000)
            }
        },
        open(url) {
            window.open(url, "_blank")
        },
        url(name) {
            const url = new URL(window.location)
            switch (name) {
                case "vscode":
                    url.host = url.host.replace("app", `${this.username}-code`)
                    break;
                default:
                    url.host = url.host.replace("app", name)
            }
            return url.toString()
        },
    }
})
