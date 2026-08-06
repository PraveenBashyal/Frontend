import {useState} from "react"
import {getTitle,getNews,getData} from "../api/ViewerAPI"
import {useParams} from "react-router-dom"

export default function StockDetail(){

    const {symbol} = useParams();

    const [description,setDescription] = useState("")
    const [news,setNews] = useState([])    
    const [marketResponse,setMarketResponse] = useState("")

    const sendSymbol = async()=>{
        const response = await getTitle(symbol)
        
        const status = response.status
        if(response.status === 200){
            setDescription(response.data.extract)
        }else(
            setDescription(response.data)
        )
    }


    const grabNews = async()=>{
        const responseNews = await getNews(symbol)
        setNews(responseNews.data)
    }

    const grabMarketData = async()=>{
        const response = await getData(symbol)
        const regularMarketPrice = response.chart.result[0].meta.regularMarketPrice
        const closePrice = response.chart.result[0].meta.chartPreviousClose

        if(regularMarketPrice > closePrice){
            setMarketResponse("Price is high 📈")
        }else{
            setMarketResponse("Price is low 📉")
        }        
    }

    const handleSubmit = async(e)=>{
        e.preventDefault()
        await sendSymbol()
        await grabNews()
        await grabMarketData()  
    }


    return(
        <form onSubmit = {handleSubmit}>
        <h1>{symbol}</h1>
        <p>{description}</p>
        <button>click</button>
        {news.map((item,index)=>(
            <div key={index}>
                <li>Headline: {item.headline} <br></br> Source: {item.source} <br></br> Summary: {item.summary} <br></br> Image: {item.image} <br></br></li>
            </div>
        ))}
        <br></br>
        <h2>Status: {marketResponse}</h2>
        </form>
    )
}