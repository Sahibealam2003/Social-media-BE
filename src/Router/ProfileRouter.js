const express = require("express")
const router = express.Router()
const{isLoggedIn} = require("../Middlewares/isLoggedIn")
const { User } = require("../Models/User")


router.patch("/profile/:userId", isLoggedIn, async(req, res) => {
    try {
        const{firstName, lastName, bio} = req.body
        const{userId} = req.params

        if(userId != req.user._id.toString())
        {
            throw new Error("Invalid Operation / Access Denied")
        }
        const updatedUser = await User.findByIdAndUpdate(userId, {firstName, lastName, bio}, {new : true}).select("firstName lastName mail username gender dateOfBirth profilePicture followers following blocked isPrivate posts bio").populate("posts")
        // console.log(updatedUser)
        res.status(200).json({msg : "done", data : updatedUser})


    } catch (error) {
        res.status(400).json({error : error.message})
    }
})


router.patch("/profile/:userId/profile-picture", isLoggedIn, async(req, res) => {
    try {
        const{profilePicture} = req.body
        const{userId} = req.params
        if(userId != req.user._id.toString())
        {
            throw new Error("Invalid Operation / Access Denied")
        }
        const updatedUser = await User.findByIdAndUpdate(userId, {profilePicture}, {new : true}).select("firstName lastName mail username gender dateOfBirth profilePicture followers following blocked isPrivate posts bio").populate("posts")
        res.status(200).json({msg : "done", data : updatedUser})

    } catch (error) {
        res.status(400).json({error : error.message})
        
    }
})

module.exports = {
  router
}