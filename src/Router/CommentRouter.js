const express = require("express");
const { isLoggedIn } = require("../Middlewares/isLoggedIn");
const router = express.Router();
const { Post } = require("../Models/Posts");
const { Comment } = require("../Models/Comment");

router.post("/comments/:postId", isLoggedIn, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    // Find post and populate author for privacy checks
    const foundPost = await Post.findById(postId).populate("author");
    if (!foundPost) {
      throw new Error("Post not Found (comment 14)");
    }

    if (foundPost.author.isPrivate) {
      // Allow comment if post owner OR a follower
      if (
        foundPost.author._id.toString() === req.user._id.toString() ||
        foundPost.author.followers.some(
          (item) => item.toString() === req.user._id.toString()
        )
      ) {
        const newComment = await Comment.create({
          author: req.user._id,
          text,
        });
        foundPost.comments.push(newComment);
        await foundPost.save();

        // ✅ Missing response added
        res.status(200).json({ msg: "Comment Done", data: foundPost });
      } else {
        throw new Error("Invalid Operation(comment 25)");
      }
    } else {
      // Public account → anyone can comment
      const newComment = await Comment.create({ author: req.user._id, text });
      foundPost.comments.push(newComment);
      await foundPost.save();

      res.status(200).json({ msg: "Comment Done", data: foundPost });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = {
  router,
};
