const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../Middlewares/isLoggedIn");
const { Post } = require("../Models/Posts");
const { isAuthor } = require("../Middlewares/isAuthor");

// Create post
router.post("/posts/create", isLoggedIn, async (req, res) => {
  try {
    const { caption, location, media } = req.body;
    if (!media) {
      throw new Error("Posts must contain at least one media file");
    }
    const newPost = await Post.create({
      caption,
      location,
      media,
      author: req.user._id,
    });
    req.user.posts.push(newPost._id);
    await req.user.save();
    res.status(200).json({ msg: "Done", data: newPost });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all posts
router.get("/posts", isLoggedIn, async (req, res) => {
  try {
    const allPosts = await Post.find({ author: req.user._id });
    res.status(200).json({ msg: "Done", data: allPosts });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get single post
router.get("/posts/:id", isLoggedIn, isAuthor, async (req, res) => {
  try {
    const { id } = req.params;
    const foundData = await Post.findOne({
      $and: [{ _id: id }, { author: req.user._id }],
    });
    if (!foundData) {
      throw new Error("Invalid Operation");
    }
    res.status(200).json({ msg: "Done", data: foundData });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete post
router.delete("/posts/:id", isLoggedIn, isAuthor, async (req, res) => {
  try {
    const { id } = req.params;
    await Post.deleteOne({ _id: id });
    res.status(200).json({ msg: "Deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = {
  router,
};
