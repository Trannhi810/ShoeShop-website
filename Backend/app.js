const express = require("express")
const path = require("path")

const connectDB = require("./config/database")
const productRoutes = require("./routes/productRoutes")

const app = express()

app.use(express.json())

connectDB()

// API
app.use("/api/products", productRoutes)

// serve frontend
app.use(express.static(path.join(__dirname, "../Frontend")))

app.get("/", (req,res)=>{
    res.sendFile(path.join(__dirname, "../Frontend/index.html"))
})

app.listen(5000, ()=>{
    console.log("Server running http://localhost:5000")
})