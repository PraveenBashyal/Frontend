import axios from "axios"


// Set VITE_API_URL in .env.local to point at a backend on another machine
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081/"
const publicAPI = axios.create({
    baseURL : BASE_URL,
    withCredentials: true
}
)
export default publicAPI;