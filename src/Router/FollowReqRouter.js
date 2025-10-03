const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../Middlewares/isLoggedIn");
const { User } = require("../Models/User");
const { FollowRequest } = require("../Models/FollowRequest");

/**
 * Route: POST /follow-request/:toUserId
 * Purpose: Send a follow request to another user
 * Access: Protected (only logged-in users)
 */
router.post("/follow-requests/:toUserId", isLoggedIn, async (req, res) => {
  try {
    const { toUserId } = req.params;

    // Prevent user from sending request to themselves
    if (toUserId == req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    // Check if request already exists
    const existingRequest = await FollowRequest.findOne({
      fromUserId: req.user._id,
      toUserId,
    });

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return res
          .status(400)
          .json({ error: "Follow request already pending" });
      } else if (existingRequest.status === "accepted") {
        return res
          .status(400)
          .json({ error: "You are already following this user" });
      }
    }

    // Check if target user exists
    const targetUser = await User.findById(toUserId).populate('posts');
    if (targetUser.blocked.some((id) => id.equals(req.user._id))) {
      throw new Error("You are blocked");
    }
    if (!targetUser) {
      return res.status(404).json({ error: "User does not exist" });
    }

    // If user is private -> create a pending request
   if (targetUser.isPrivate) {
  await FollowRequest.create({
    toUserId,
    fromUserId: req.user._id,
    status: "pending",
  });

  return res.status(200).json({
    msg: `Follow request sent to user: ${targetUser.username}`,
    data: req.user,        // current user (no change in following yet)
    toUserData: targetUser // target user
  });
}


    // If user is public -> auto accept follow request
    await FollowRequest.create({
      toUserId,
      fromUserId: req.user._id,
      status: "accepted",
    });

    // Add current user to target's followers
    targetUser.followers.push(req.user._id);
    await targetUser.save();

    // Add target user to current user's following
    req.user.following.push(toUserId);
    await req.user.save();

return res.status(200).json({
  msg: `Now following user: ${targetUser.username}`,
  data: req.user,          // updated current user
  toUserData: targetUser   // updated target user
});

  } catch (error) {
    console.error("Error in follow request:", error.message);

    // Fallback error response
    return res.status(500).json({
      error: "Something went wrong while processing the follow request",
      details: error.message,
    });
  }
});

// Review Follow Request Route (Accept / Reject)
router.patch(
  "/follow-requests/review/:id/:status",
  isLoggedIn,
  async (req, res) => {
    try {
      const { id, status } = req.params;

      // Check if follow request exists for the logged-in user
      const foundReq = await FollowRequest.findOne({
        _id: id,
        toUserId: req.user._id,
      });

      if (!foundReq) {
        // If no request found → throw error
        throw new Error("Request does not exist or Invalid Operation");
      }

      // Request should only be pending to take action
      if (foundReq.status !== "pending") {
        throw new Error("Invalid Operation - Request already handled");
      }

      // If request is rejected → delete it
      if (status === "rejected") {
        await FollowRequest.deleteOne({ _id: id });
        return res.status(200).json({ msg: "Request Rejected & Deleted" });
      }

      // If status is neither accepted nor rejected → invalid
      if (status !== "accepted") {
        throw new Error("Invalid Status - Allowed values: accepted/rejected");
      }

      // Mark request as accepted
      foundReq.status = status;
      await foundReq.save();

      // Add follower to logged-in user
      req.user.followers.push(foundReq.fromUserId);
      await req.user.save();

      // Add following to sender user
      const senderData = await User.findById(foundReq.fromUserId);
      senderData.following.push(req.user._id);
      await senderData.save();

      return res.status(200).json({ msg: "Follow Request Accepted" });
    } catch (error) {
      // Centralized error handling with clear message
      res.status(400).json({ error: error.message || "Something went wrong" });
    }
  }
);

//Unfollow Request
router.patch("/follow-requests/unfollow/:id", isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const foundUser = await User.findById(id).populate("posts")
    if (!foundUser) {
      throw new Error("User not Found (unfollow 152)");
    }
    if (
      foundUser.followers.some((item) => {
        return item.toString() == req.user._id.toString();
      })
    ) {
      const filtredFollowers = foundUser.followers.filter((item) => {
        return item.toString() != req.user._id.toString();
      });
      foundUser.followers = filtredFollowers;
      await foundUser.save();

      const filtredFollowing = foundUser.following.filter((item)=>{
        return item.toString() != foundUser._id.toString()
      })

      req.user.following = filtredFollowing
      await req.user.save()

      await FollowRequest.deleteOne({
        $or:[
          {
            $and : [
              {fromUserId : id},
              {toUserId : req.user._id}
            ]},
          {
            $and : [
              {fromUserId : req.user._id},
              {toUserId : id}
            ]
          }
        ]
      })

    } else {
      throw new Error("Invalid Operation(unfollow(165))");
    }
     res.status(200).json({msg : "done", data : req.user, toUserData : foundUser})
  } catch (error) {
    res.status(400).json({error : error.message})

  }
});

// Block User Route
router.patch("/follow-request/block/:userId", isLoggedIn, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.blocked.some((id) => id.toString() === userId)) {
      throw new Error("User already blocked");
    }
    // Prevent self-blocking
    if (req.user._id.equals(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot block yourself" });
    }

    // Find the user to be blocked
    const foundUser = await User.findById(userId);
    if (!foundUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Add to blocked list only if not already blocked
    if (
      foundUser.blocked.some((id) => id.toString() === req.user._id.toString())
    ) {
      throw new Error("Invalid Operation(168 line)");
    }
    if (!req.user.blocked.includes(foundUser._id)) {
      req.user.blocked.push(foundUser._id);
    }

    // --- Update Blocked User ---
    // Remove blocker (logged-in user) from blocked user's followers
    foundUser.followers = foundUser.followers.filter(
      (item) => item.toString() !== req.user._id.toString()
    );

    // Remove blocker from blocked user's following
    foundUser.following = foundUser.following.filter(
      (item) => item.toString() !== req.user._id.toString()
    );

    await foundUser.save();

    // --- Update Blocker (logged-in user) ---
    // Remove blocked user from requester's followers
    req.user.followers = req.user.followers.filter(
      (item) => item.toString() !== userId
    );

    // Remove blocked user from requester's following
    req.user.following = req.user.following.filter(
      (item) => item.toString() !== userId
    );

    await req.user.save();

      await FollowRequest.deleteOne({
        $or:[
          {
            $and : [
              {fromUserId : userId},
              {toUserId : req.user._id}
            ]},
          {
            $and : [
              {fromUserId : req.user._id},
              {toUserId : userId}
            ]
          }
        ]
      })

    // Success response
    res
      .status(200)
      .json({ msg: `User ${foundUser.username} blocked successfully` });
  } catch (error) {
    // Centralized error handler
    res.status(400).json({
      error: error.message || "Something went wrong while blocking user",
    });
  }
});

// Unblock User Route
router.patch(
  "/follow-request/unblock/:userId",
  isLoggedIn,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Remove the user from the blocked list (filter out matching userId)
      const filteredBlockedUser = req.user.blocked.filter(
        (id) => id.toString() !== userId
      );

      // Update logged-in user's blocked list
      req.user.blocked = filteredBlockedUser;
      await req.user.save();

      // Success response
      res.status(200).json({ msg: "User unblocked successfully" });
    } catch (error) {
      // Centralized error handler
      res.status(400).json({
        error: error.message || "Something went wrong while unblocking user",
      });
    }
  }
);


// Search Users
router.get("/follow-requests/search", isLoggedIn, async(req, res) => {
    try {
        const{q} = req.query
         const foundUsers = await User.find({
                $and: [
                    { _id: { $ne: req.user._id } },
                    {
                    $or: [
                        { firstName: { $regex: q, $options: "i" } },
                        { lastName: { $regex: q, $options: "i" } },
                        { username: { $regex: q, $options: "i" } }
                    ]
                    }
                ]
                }
                )
            .select("profilePicture firstName lastName username ")

        res.status(200).json({data : foundUsers})

    } catch (error) {
        res.status(400).json({error : error.message})
    }
})


router.get("/follow-requests/check/:toUserId", isLoggedIn, async(req, res) => {
    try {
        const{toUserId} = req.params
        const flag = await FollowRequest.findOne({
            toUserId : toUserId,
            fromUserId : req.user._id
        })
        res.status(200).json({flag : (flag ? true : false), status : flag?.status})
    } catch (error) {
        res.status(400).json({error : error.message})
    }
})


router.delete("/follow-requests/:userId", isLoggedIn, async(req, res) => {
    try {
        const{userId} = req.params
        const flag = await FollowRequest.findOneAndDelete({
            toUserId : userId,
            fromUserId : req.user._id
        })
        console.log(flag)
        res.status(200).json({msg : "done"})
    } catch (error) {
        res.status(400).json({error : error.message})
    }
})

router.get("/follow-requests", isLoggedIn, async(req, res) => {
    try {
        const foundRequests = await FollowRequest.find({
            toUserId : req.user._id,
            status : "pending"
        }).populate("fromUserId")

        res.status(200).json({data : foundRequests})
    } catch (error) {
        res.status(400).json({error : error.message})
    }
})
module.exports = {
  router,
};
