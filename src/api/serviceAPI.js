import axios from "axios"

// The Node service under server/ — portfolio and the assistant.
// Sahil's Spring Boot backend stays on privateAPI; this is separate.
const BASE_URL = import.meta.env.VITE_SERVICE_URL || "http://localhost:8082/"

const serviceAPI = axios.create({ baseURL: BASE_URL })

// Same token the backend issued; the service only verifies it
serviceAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default serviceAPI
