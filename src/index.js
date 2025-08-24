require('dotenv').config()
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors= require('cors')
const cookieParser = require('cookie-parser')
const {router : otpRouter}= require('./Router/OtpRouter')


app.use(express.json())
app.use(cors())
app.use(cookieParser()) 
app.use('/api',otpRouter)


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
