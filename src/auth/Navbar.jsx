import {Link,useNavigate} from "react-router-dom"
import {useAuth} from "../api/AuthContext"

export default function Navbar(){

    const navigate = useNavigate()
    const {user,removeToken,AccessToken} = useAuth()

    function Logout(){
        removeToken()
    }

    return(
        <nav>
            <div>
                <Link to = "/SearchStocks">Search</Link>
                <Link to ="/UserWatchList">Watchlist</Link>
                <Link to ="/stock/:symbol">Assets</Link>
            </div>
            <div>
                <span>{user.Name}</span>
                <button onClick ={()=>Logout()}>Logout</button>
            </div>

        </nav>
    )

}