const { Post } = require("../Models/Posts")


const isAuthor  = async(req,res,next)=>{
 try {
    const {id} = req.params
    const foundPost = await Post.findOne({_id : id})
    if(!foundPost){
        throw new Error("Post not found")
    }

    if(!foundPost.author.equals(req.user._id)){
        throw new Error("You are not authorie for this action")
    }
    next()
 } catch (error) {
    res.status(400).json({error : error.message})
 }
}

module.exports={
    isAuthor
}