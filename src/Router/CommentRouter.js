const express = require("express");
const { isLoggedIn } = require("../Middlewares/isLoggedIn");
const router = express.Router();
const { Post } = require("../Models/Posts");
const { Comment } = require("../Models/Comment");
const { Reply } = require("../Models/Reply");

//Add comments
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
        foundPost.comments.push(newComment._id);
        await foundPost.save();

        // ✅ Missing response added
        res.status(200).json({ msg: "Comment Done", data: foundPost });
      } else {
        throw new Error("Invalid Operation(comment 25)");
      }
    } else {
      // Public account → anyone can comment
      const newComment = await Comment.create({ author: req.user._id, text });
      foundPost.comments.push(newComment._id);
      await foundPost.save();

      res.status(200).json({ msg: "Comment Done", data: foundPost });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Add a Like on Commnet
router.post(
  "/comments/:postId/:commentId/like",
  isLoggedIn,
  async (req, res) => {
    try {
      const { postId, commentId } = req.params;

      const foundPost = await Post.findById(postId).populate("author");
      if (!foundPost) {
        throw new Error("Post not found");
      }

      const foundComment = await Comment.findById(commentId);
      if (!foundComment) {
        throw new Error("Comment not found");
      }

      if (
        foundComment.likes.some(
          (item) => item.toString() == req.user._id.toString()
        )
      ) {
        throw new Error("Can not like a comment more then one");
      }
      // Ensure the comment actually belongs to this post
      const isCommentInPost = foundPost.comments.some(
        (item) => item.toString() === commentId.toString()
      );
      if (!isCommentInPost) {
        throw new Error("Invalid Operation (comment not part of post)");
      }

      // Private post handling (but your Post schema does NOT have followers)
      if (foundPost.author.isPrivate) {
        if (!foundPost.followers) {
          throw new Error("Followers list missing in Post schema");
        }

        const isFollower = foundPost.followers.some(
          (item) => item.toString() === req.user._id.toString()
        );
        const isAuthor =
          foundPost.author._id.toString() === req.user._id.toString();

        if (!isFollower && !isAuthor) {
          throw new Error("Not allowed to like comment on private post");
        }
      }

      // Prevent duplicate likes
      const alreadyLiked = foundComment.likes.some(
        (id) => id.toString() === req.user._id.toString()
      );
      if (alreadyLiked) {
        throw new Error("You already liked this comment");
      }

      // Add like
      foundComment.likes.push(req.user._id);
      await foundComment.save();

      res.status(201).json({
        msg: "Comment liked successfully",
        data: foundComment,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post("/comments/:postId/:commentId/reply",isLoggedIn,async (req, res) => {
    try {
      const { postId, commentId } = req.params;
      const { text } = req.body;
      const foundPost = await Post.findById(postId).populate("author");
      if (!foundPost) {
        throw new Error("Post not found");
      }

      const foundComment = await Comment.findById(commentId);
      if (!foundComment) {
        throw new Error("Comment not found");
      }

      if (foundPost.comments.some((item) => item.toString() == commentId)) {
        if (foundPost.author.isPrivate) {
          if (
            foundPost.author.followers.some(
              (item) => item.toString() == req.user._id.toString()
            )
          ) {
            const newReply = await Reply.create({ text, author: req.user._id });
            foundComment.reply.push(newReply._id);
            await foundComment.save();
          } else {
            throw new Error("Invalid Operation 147 Not follow");
          }
        } else {
          const newReply = await Reply.create({ text, author: req.user._id });
          foundComment.reply.push(newReply._id);
          await foundComment.save();
        }
      } else {
        throw new Error("Invalid Operation Reply 161");
      }
      res.status(201).json({msg : 'Done reply' ,data : foundPost})
    } catch (error) {
      res.status(400).json({error: error.message})
    }
  }
);

module.exports = {
  router,
};
