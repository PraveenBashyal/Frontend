import axios from "axios"
import {refreshEndpoint} from "../api/ViewerAPI"
// Set VITE_API_URL in .env.local to point at a backend on another machine
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081/"
const privateAPI = axios.create({
    baseURL : BASE_URL,
    withCredentials: true
}
)
privateAPI.interceptors.request.use((config)=>{
    const token = localStorage.getItem("accessToken")
        if(token){
            config.headers.Authorization = `Bearer ${token}`;
            //console.log(config)
        }
        return config;
    },
    (error)=>{
        return Promise.reject(error);
    }
)

// Concurrent 401s share one refresh instead of racing each other
let refreshing = null

function refreshOnce(){
    if(!refreshing){
        refreshing = refreshEndpoint()
            .then(response => {
                const token = response.data.AccessToken
                localStorage.setItem("accessToken",token)
                return token
            })
            .finally(() => { refreshing = null })
    }
    return refreshing
}

// Refresh failed — sign out instead of keeping a dead token
function endSession(){
    localStorage.removeItem("accessToken")
    if(window.location.pathname !== "/login"){
        window.location.replace("/login")
    }
}

privateAPI.interceptors.response.use(
 (response)=>{
        return response;
    },
    async (error)=>{
        const originalRequest = error.config;
        if(!error.response){
            console.log("Network error: ",error.message)
            return Promise.reject(error)
        }


        if(error.response.status === 401 && !originalRequest._retry){
            originalRequest._retry = true;

            try{
                const token = await refreshOnce()
                originalRequest.headers.Authorization = `Bearer ${token}`
                return privateAPI(originalRequest)
            }catch{
                endSession()
                return Promise.reject(error)
            }
        }
        else if(error.response.status === 403){
            console.log("No Permission")
        }
        return Promise.reject(error);
    }
)



export default privateAPI;
