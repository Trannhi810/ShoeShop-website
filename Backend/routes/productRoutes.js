const express = require("express")
const router = express.Router()
const Product = require("../schemas/productSchema")

router.post("/", async (req,res)=>{
    const product = await Product.create(req.body)
    res.json(product)
})

router.get("/", async (req,res)=>{
    const products = await Product.find()
    res.json(products)
})

module.exports = router