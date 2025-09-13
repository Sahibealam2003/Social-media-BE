const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../Middlewares/isLoggedIn");
const { Post } = require("../Models/Posts");
const { isAuthor } = require("../Middlewares/isAuthor");

// Route: Create a new post
// Access: Logged-in users only
router.post("/posts/create", isLoggedIn, async (req, res) => {
  try {
    const { caption, location, media } = req.body;

    // Validation: Media is required
    if (!media.length) {
      throw new Error("Posts must contain at least one media file");
    }

    // Create a new post
    const newPost = await Post.create({
      caption,
      location,
      media,
      author: req.user._id,
    });

    // Push the new post ID into the user's posts array
    req.user.posts.push(newPost._id);
    await req.user.save();

    res.status(200).json({ msg: "Post created successfully", data: newPost });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route: Get all posts of the logged-in user
// Access: Logged-in users only
router.get("/posts", isLoggedIn, async (req, res) => {
  try {
    // Find all posts belonging to the logged-in user
    const allPosts = await Post.find({ author: req.user._id });
    res.status(200).json({ msg: "Fetched all posts", data: allPosts });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route: Get a single post by ID
// Access: Logged-in users and must be the author of the post
router.get("/posts/:id", isLoggedIn, isAuthor, async (req, res) => {
  try {
    const { id } = req.params;

    // Find post with matching ID and author
    const foundData = await Post.findOne({
      $and: [{ _id: id }, { author: req.user._id }],
    });

    if (!foundData) {
      throw new Error("Post not found or unauthorized access");
    }

    res.status(200).json({ msg: "Fetched single post", data: foundData });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route: Delete a post by ID
// Access: Logged-in users and must be the author of the post
router.delete("/posts/:id", isLoggedIn, isAuthor, async (req, res) => {
  try {
    const { id } = req.params;

    // Delete the post by ID
    const deleted = await Post.deleteOne({ _id: id });

    if (deleted.deletedCount === 0) {
      throw new Error("Post not found");
    }

    res.status(200).json({ msg: "Post deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route: Update a post by ID
// Access: Logged-in users and must be the author of the post
router.patch("/posts/:id", isLoggedIn, isAuthor, async (req, res) => {
  try {
    const { id } = req.params;
    const { caption, location } = req.body;

    // Update the post with new values
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { caption, location },
      { returnDocument: "after" } // Ensures updated document is returned
    );

    if (!updatedPost) {
      throw new Error("Post not found");
    }

    res
      .status(200)
      .json({ msg: "Post updated successfully", data: updatedPost });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Like a post
router.patch("/posts/:id/like", isLoggedIn, async (req, res) => {
  try {
    // Extract post id from params
    const { id } = req.params;

    // Find post and populate author for privacy checks
    const foundPost = await Post.findById(id).populate("author");

    // If post not found, stop
    if (!foundPost) {
      throw new Error("Post not found");
    }

    // Prevent duplicate likes by same user
    if (
      foundPost.likes.some((id) => id.toString() === req.user._id.toString())
    ) {
      throw new Error("Post already liked");
    }

    // If author's profile is private, only followers can like
    if (foundPost.author.isPrivate) {
      // Allow like only if current user is a follower
      if (foundPost.author.followers.some((id) => id.equals(req.user._id))) {
        foundPost.likes.push(req.user._id);
        await foundPost.save();
      } else {
        // Not a follower of a private account
        throw new Error("Invalid Operation(like 131)");
      }
    } else {
      // Public account: allow like
      foundPost.likes.push(req.user._id);
      await foundPost.save();
    }

    // Success response
    res.status(200).json({ msg: "Like Done", data: foundPost });
  } catch (error) {
    // Error response
    res.status(400).json({ error: error.message });
  }
});

// Unlike a post
router.patch("/posts/:id/unlike", isLoggedIn, async (req, res) => {
  try {
    // Extract post id from params
    const { id } = req.params;

    // Find post and populate author for privacy checks
    const foundPost = await Post.findById(id).populate("author");

    // If post not found, stop
    if (!foundPost) {
      throw new Error("Post not found");
    }

    // If author's profile is private, only followers can unlike
    if (
      foundPost.author.isPrivate &&
      !foundPost.author.followers.some(
        (id) => id.toString() === req.user._id.toString()
      )
    ) {
      throw new Error("Invalid Operation (unLike 157)");
    }

    // Proceed only if user has already liked the post
    if (
      foundPost.likes.some((id) => id.toString() === req.user._id.toString())
    ) {
      // Filter out current user's like
      const filteredLikes = foundPost.likes.filter((id) => {
        return id.toString() !== req.user._id.toString();
      });

      // Assign filtered array and save
      foundPost.likes = filteredLikes;
      await foundPost.save();
    } else {
      // User had not liked this post
      throw new Error("Invalid Operation(unlike 162)");
    }

    // Success response
    res.status(200).json({ msg: "Unlike Done", data: foundPost });
  } catch (error) {
    // Error response
    res.status(400).json({ error: error.message });
  }
});

module.exports = {
  router,
};
