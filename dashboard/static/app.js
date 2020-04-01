axios.defaults.timeout = 180000

// Get a domain info to build our urls
const {protocol, hostname, port} = location

const app = new Vue({
    el: '#app',
    data() {
        return {
            baseURL: new URL(window.location),
            error: null,
            username: "",
            usernameSlug: "",
            userTools: {
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

        this.statusUserTools()
    },
    computed: {
        canStart() {
            return this.userTools.status && !this.userTools.isRunning
        },
        canStop() {
            return this.userTools.status && this.userTools.isRunning
        }
    },
    methods: {
        isDisabled(name) {
            if (name !== "vscode" && name !== "jupyter") {
                return false
            }
            return this.userTools.status && !this.userTools.isRunning
        },
        async statusUserTools() {
            const res = await axios.post(`/api/status`)

            this.userTools.status = true
            this.userTools.isRunning = res.data.running
            this.username = res.headers['x-forwarded-user']
            this.usernameSlug = res.headers['x-forwarded-user-slug']
        },
        async startUserTools() {
            this.error = null
            this.userTools.isLoading = true
            try {
                await axios.post(`/api/start`)
                this.userTools.status = true
                this.userTools.isRunning = true
            } catch (e) {
                this.error = e
                console.log("Error: ", e)
            } finally {
                this.userTools.isLoading = false
            }
        },
        async stopUserTools() {
            this.error = null
            this.userTools.isLoading = true
            try {
                await axios.post(`/api/stop`)
            } catch (e) {
                this.error = e
                console.log("Error: ", e)
            } finally {
                setTimeout(() => {
                    this.statusUserTools()
                    this.userTools.isLoading = false
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
                    url.host = url.host.replace("app", `${this.usernameSlug}-code`)
                    break;
                case "jupyter":
                    url.host = url.host.replace("app", `${this.usernameSlug}-jupyter`)
                    break;
                default:
                    url.host = url.host.replace("app", name)
            }
            return url.toString()
        },
    }
})
