const express = require('express')
const app = express()
const mongoose = require('mongoose')
require('dotenv').config()
const cors= require('cors')
const cookieParser = require('cookie-parser')


app.use(express.json())
app.use(cors())
app.use(cookieParser()) 


mongoose.connect(process.env.MONGO_URL) // ✅ correct key
.then(()=>{
    console.log('DB connected');
    app.listen(process.env.PORT,()=>{
        console.log('Server running on ' + process.env.PORT);
    })
})
.catch((err)=>{
    console.log('DB not connected', err.message);
})
