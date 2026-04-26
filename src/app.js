import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()

//configurations
app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials:true
    }
))

app.use(cookieParser())

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true , limit:"16kb"}))
app.use(express.static("public"))



// import routes
import consumerRoute from "./routes/consumer.routes.js"
import sellerRoute from "./routes/seller.routes.js"




// routes declaration
app.use("/api/v1/consumer" , consumerRoute )
app.use("/api/v1/seller" , sellerRoute )

export {app}