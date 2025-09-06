const mongoose = require('mongoose')
const commentSchema = new mongoose.Schema({
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
  ],
  reply : []

})

const Comment = mongoose.model('comment',commentSchema)
module.exports ={
    Comment
}