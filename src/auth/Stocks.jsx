import {useState,useEffect} from "react"
import {getStocks,getCrypto,getETF,addStockToWatchlist} from "../api/ViewerAPI"


export default function SearchStocks(){
     
    const [inputText,setInputText] = useState("")
    const [stockList,setStockList] = useState([])
    const [watchlist,setWatchList] = useState([])
    const [optionType,setOptionType] = useState("Stock")

    useEffect(()=>{

        if(inputText.trim() ==""){
            setStockList([])
            return
        }


        if(optionType === "Stock"){
            const stocks = async ()=>{
            const data_list = await getStocks(inputText)
            setStockList(data_list)
        }
            stocks()

        }else if(optionType === "Crypto"){
            const crypto = async()=>{
                const response = await getCrypto(inputText)
                setStockList(response)
            }
            
            crypto()
        }else if(optionType === "ETF"){
            const etf = async()=>{
                const response = await getETF(inputText)
                setStockList(response)
            }

            etf()
        }

        

       
  
    },[inputText])

   

    const handleSubmit = (e)=>{
        e.preventDefault()
    }

    function addToWatchlist(asset){
        if(watchlist.some((item)=>item.symbol === asset.symbol)){
            return
        }
        setWatchList((prev)=>[...prev,asset])

        const stockData ={
            "symbol" : asset.symbol,
            "securityName" : asset.securityName,
            "type" : optionType
        }
        const data = async()=>{
            const response = await addStockToWatchlist(stockData)
        }

        data()
    }



    return(
        <form onSubmit = {handleSubmit}>
        <h1>Get the stock</h1>
            <label>Type: </label>
            <select value = {optionType} onChange={(e)=>setOptionType(e.target.value)}>
                <option default value="Stock">Stock</option>
                <option value="Crypto">Crypto</option>
                <option value="ETF">ETF</option>
            </select><br></br>
            <label>Enter the {optionType}: </label>
            <input value={inputText} onChange = {(e)=>setInputText(e.target.value)}></input><br></br>
            <ul>{stockList.map((item,index)=>(
                <div key={index}>
                <li>{item.symbol} <br></br>{item.securityName} <br></br>{item.type}</li>
                <button onClick ={()=>addToWatchlist(item)}>Add</button>
                {console.log(stockList)}
                </div>
            ))}</ul>
        </form>
    )
}