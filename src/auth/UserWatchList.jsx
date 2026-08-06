    import {useState} from "react"
    import {getWatchlist,deteleWatchlist} from "../api/ViewerAPI"
    import {getTitle} from "../api/ViewerAPI"
    import {useNavigate} from "react-router-dom"

    export default function UserWatchList(){
        
        const navigate = useNavigate();

        const [usersWatchList,setUsersWatchList] = useState([])

        const watchlist = async()=>{
            const response = await getWatchlist()
            setUsersWatchList(response)
        }
               

        const handleSubmit = (e)=>{
            e.preventDefault()
            watchlist()
        }
            
        async function deleteStock(symbol){
            await deteleWatchlist(symbol)
            watchlist();
        }

        



        
        return(
            <form onSubmit = {handleSubmit}>
                <button>Click</button>    
                {usersWatchList.map((item,index)=>(
                    <ul key={index}>
                        <li>{item.symbol} <br></br> {item.securityName} <br></br> Type: {item.type}</li>
                        <button type="button" onClick ={()=>deleteStock(item.symbol)}>Delete</button>
                        <button onClick = {()=>navigate(`/stock/${item.symbol}`)} type="button">Click</button>
                   </ul>
                ))}          
            </form>
        )


    }