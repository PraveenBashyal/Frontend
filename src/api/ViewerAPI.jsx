import publicAPI from "./publicAPI"
import privateAPI from "./privateAPI"

export const InvestorRegistration = async(inputList)=>{
    const response = await publicAPI.post("investor/register",inputList)
    return response
}


export const login = async(loginData)=>{
    const response = await publicAPI.post("investor/login",loginData)
    return response
}

export const getUsers = async()=>{
    const response = await privateAPI.get("investor/all")
    return response
}

export const getAsset = async(assetType)=>{
    const response = await privateAPI.get(`/assets/asset?type=${assetType}`)
    return response
}

export const getStocks= async(query)=>{
    const response = await privateAPI.get(`/Stock/stocks?query=${query}`)
    return response.data;
}

export const addStockToWatchlist = async(stock)=>{
    const response = await privateAPI.post("/watchlist/add",stock)
    return response.data
}

export const getWatchlist = async()=>{
    const response = await privateAPI.get("/watchlist/all") 
    return response.data
}

export const deteleWatchlist = async(symbol)=>{
    const response = await privateAPI.delete(`/watchlist/${symbol}`)
    return response.data
}

export const refreshEndpoint = async()=>{
    const response = await publicAPI.post("investor/refresh")
    return response
}

export const getTitle = async(symbol)=>{
    const response = await publicAPI.post(`/stock/${symbol}`)
    return response
}

export const getNews = async(symbol)=>{
    const response = await publicAPI.post(`/news/${symbol}`)
    return response
}

export const getData = async(symbol)=>{
    const response = await privateAPI.post(`/data/${symbol}`)
    return response.data
}

export const getCrypto = async(query)=>{
    const response = await privateAPI.get(`Crypto/crypto?query=${query}`)
    return response.data
}

export const getETF = async(query)=>{
    const response = await privateAPI.get(`ETF/etf?query=${query}`)
    return response.data
}