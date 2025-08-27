const mongoose  = require("mongoose")

const postSchema = new mongoose.Schema({
  caption: { 
    type: String,
    trim : true,
    maxlength : 200
},
  location: { 
    type: String,
    minlength : 3,
    maxlength : 20,
    trim : true
},
  comments: [],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  media: [{ type: String, required: true }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });


const Post = mongoose.model("Post", postSchema)
module.exports = {
    Post
}