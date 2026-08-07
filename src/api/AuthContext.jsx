import {useState, useContext,createContext} from "react"
import {jwtDecode} from "jwt-decode"

const AuthContext = createContext()

// Restore the saved token so a reload keeps the session.
// Expired or unreadable tokens are cleared.
function loadSession(){
    const token = localStorage.getItem("accessToken")
    if(!token) return {AccessToken:"", user:""}

    try{
        const decoded = jwtDecode(token)
        if(decoded.exp && decoded.exp * 1000 <= Date.now()){
            localStorage.removeItem("accessToken")
            return {AccessToken:"", user:""}
        }
        return {AccessToken: token, user: decoded}
    }catch{
        localStorage.removeItem("accessToken")
        return {AccessToken:"", user:""}
    }
}

export default function AuthProvider({children}){

    const [session,setSession] = useState(loadSession)

    const saveToken = (data)=>{
        const token = data.AccessToken
        localStorage.setItem("accessToken",token)
        setSession({AccessToken: token, user: jwtDecode(token)})
    }

    const removeToken= ()=>{
        localStorage.removeItem("accessToken")
        setSession({AccessToken:"", user:""})
    }

    return(
        <AuthContext.Provider
        value = {
            {
            saveToken,
            removeToken,
            AccessToken: session.AccessToken,
            user: session.user
        }
        }
        >{children}</AuthContext.Provider>
    )

}

export  function useAuth(){
    return useContext(AuthContext)
}
