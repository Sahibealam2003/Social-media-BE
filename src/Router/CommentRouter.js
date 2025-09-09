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

// Route to reply to a comment on a post
router.post("/comments/:postId/:commentId/reply",isLoggedIn,async (req, res) => {
    try {
      // Extract postId and commentId from URL parameters
      const { postId, commentId } = req.params;

      // Extract reply text from request body
      const { text } = req.body;

      // Find the post by ID and populate author details
      const foundPost = await Post.findById(postId).populate("author");

      // If post is not found, throw an error
      if (!foundPost) {
        throw new Error("Post not found");
      }

      // Find the comment by ID
      const foundComment = await Comment.findById(commentId);

      // If comment is not found, throw an error
      if (!foundComment) {
        throw new Error("Comment not found");
      }

      // Check if the comment belongs to the post
      if (foundPost.comments.some((item) => item.toString() === commentId)) {
        // If post author's profile is private
        if (foundPost.author.isPrivate) {
          // Allow reply only if the current user follows the post's author
          if (
            foundPost.author.followers.some(
              (item) => item.toString() === req.user._id.toString()
            )
          ) {
            // Create a new reply document
            const newReply = await Reply.create({ text, author: req.user._id });

            // Add reply to the comment's reply array
            foundComment.reply.push(newReply._id);

            // Save the updated comment
            await foundComment.save();
          } else {
            // Error if user is not a follower
            throw new Error("Invalid Operation 173 Not follow");
          }
        } else {
          // If author is not private, allow reply
          const newReply = await Reply.create({ text, author: req.user._id });
          foundComment.reply.push(newReply._id);
          await foundComment.save();
        }
      } else {
        // Error if the comment does not belong to the post
        throw new Error("Invalid Operation Reply 183");
      }

      // Send success response
      res.status(201).json({ msg: "Done reply", data: foundPost });
    } catch (error) {
      // Send error response in case of failure
      res.status(400).json({ error: error.message });
    }
  }
);

// Route to delete a comment from a post
router.delete("/comments/:postId/:commentId", isLoggedIn, async (req, res) => {
  try {
    // Extract postId and commentId from URL parameters
    const { postId, commentId } = req.params;

    // Find the post by postId and populate the author field
    const foundPost = await Post.findById(postId).populate("author");

    // Throw error if post not found
    if (!foundPost) {
      throw new Error("Post not found");
    }

    // Find the comment by commentId
    const foundComment = await Comment.findById(commentId);

    // Throw error if comment not found
    if (!foundComment) {
      throw new Error("Comment not found");
    }

    // Check if the comment is part of the post
    if (foundPost.comments.some((item) => item.toString() == commentId)) {

      // Case when post author's profile is private
      if (foundPost.author.isPrivate) {

        // Allow deletion if:
        // 1. The current user follows the post author AND is the author of the comment
        // OR
        // 2. The current user is the post author
        if (
          (foundPost.author.followers.some(
            (item) => item.toString() == req.user._id.toString()
          ) &&
            foundComment.author.toString() == req.user._id.toString()) ||
          foundPost.author._id.toString() == req.user._id.toString()
        ) {
          // Delete the comment document
          await Comment.findByIdAndDelete(commentId);

          // Remove the comment reference from post's comments array
          const filteredComment = foundPost.comments.filter(
            (item) => item.toString() != commentId
          );
          foundPost.comments = filteredComment;

          // Save the updated post
          await foundPost.save();

        } else {
          // Unauthorized action when private and conditions not met
          throw new Error("Invalid Operation 215");
        }

      } else {
        // Case when author's profile is public

        // Allow deletion if:
        // 1. The current user is the author of the comment
        // OR
        // 2. The current user is the post author
        if (
          foundComment.author.toString() == req.user._id.toString() ||
          foundPost.author._id.toString() == req.user._id.toString()
        ) {
          // Delete the comment document
          await Comment.findByIdAndDelete(commentId);

          // Remove the comment reference from post's comments array
          const filteredComment = foundPost.comments.filter(
            (item) => item.toString() != commentId
          );
          foundPost.comments = filteredComment;

          // Save the updated post
          await foundPost.save();

        } else {
          // Unauthorized action when public and conditions not met
          throw new Error("Access denied");
        }
      }

    } else {
      // Throw error if comment does not belong to the post
      throw new Error("Invalid Operation 213");
    }

    // Send success response
    res.status(200).json({ msg: "Delete comment Done" });

  } catch (error) {
    // Send error response in case of any failure
    res.status(400).json({ error: error.message });
  }
});

// Unlike on Commnet
router.patch("/comments/:postId/:commentId/unlike", isLoggedIn, async (req, res) => {
    try {
        const { postId, commentId } = req.params;

        // Find post and comment
        const foundPost = await Post.findById(postId).populate("author");
        const foundComment = await Comment.findById(commentId);

        if (!foundPost || !foundComment) {
            throw new Error("Post or Comment not found");
        }

        // Check if comment belongs to the post
        const isCommentInPost = foundPost.comments.some(
            (item) => item.toString() === commentId
        );

        if (!isCommentInPost) {
            throw new Error("Invalid operation: Comment not part of post");
        }

        // Handle private posts
        if (foundPost.author.isPrivate) {
            const isFollower = foundPost.author.followers.some(
                (item) => item.toString() === req.user._id.toString()
            );

            if (!isFollower) {
                throw new Error("Access denied: Must follow author to unlike");
            }
        }

        // Remove the user's like
        foundComment.likes = foundComment.likes.filter(
            (item) => item.toString() !== req.user._id.toString()
        );

        // Save the updated comment document
        await foundComment.save();

        res.status(200).json({ msg: "Comment unlike successful" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = {
  router,
};
