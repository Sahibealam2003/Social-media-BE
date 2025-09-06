const mongoose  = require('mongoose')
const replySchema=  new mongoose.Schema({
    author : {
        type: mongoose.Schema.Types.ObjectId,
        required :true,
        ref:"User"
      },
      text : {
        type :String,
        required : true,
        trim : true,
        minlength  :1
      },
      likes : [
        {
        type : mongoose.Schema.Types.ObjectId,
        ref :"User"
      }
      ]
})

const Reply = mongoose.model('Reply',replySchema)
module.exports = {
    Reply
}