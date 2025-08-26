const express = require("express");
const router = express.Router();
const validator = require("validator");
const { User } = require("../Models/User");
const bcrypt = require("bcrypt");
const { VerifiedMail } = require("../Models/VerifiedMail");
const jwt = require("jsonwebtoken");

function getAgeFromDOB(dateString) {
  const birthDate = new Date(dateString);
  if (isNaN(birthDate)) {
    throw new Error("Invalid date format. Use yyyy-mm-dd");
  }
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
}

// ✅ SIGNUP
router.post("/auth/signup", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      mail,
      password,
      dateOfBirth,
      gender,
    } = req.body;

    // Required fields check
    if (
      !firstName ||
      !lastName ||
      !username ||
      !mail ||
      !password ||
      !dateOfBirth ||
      !gender
    ) {
      return res
        .status(400)
        .json({ error: "All required fields must be provided" });
    }

    // Email verification check
    const verifiedMail = await VerifiedMail.findOne({ mail });
    if (!verifiedMail) {
      return res
        .status(400)
        .json({ error: "Please verify your email before signup" });
    }

    // Duplicate username check
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ error: "Username already taken" });
    }

    // Age check
    const age = getAgeFromDOB(dateOfBirth);
    if (age < 18) {
      return res
        .status(400)
        .json({ error: "You must be at least 18 years old" });
    }

    // Strong password check
    if (!validator.isStrongPassword(password)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await User.create({
      firstName,
      lastName,
      username,
      mail,
      password: hashedPassword,
      dateOfBirth,
      gender,
    });

    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// ✅ SIGNIN
router.post("/auth/signin", async (req, res) => {
  try {
    const { mail, username, password } = req.body;

    if ((!mail && !username) || !password) {
      return res
        .status(400)
        .json({ error: "Please provide username/email and password" });
    }

    const foundUser = await User.findOne({
      $or: [{ username }, { mail }],
    });

    if (!foundUser) {
      return res.status(404).json({ error: "User does not exist" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      foundUser.password
    );
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { _id: foundUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("jwt-token", token);

    res.status(200).json({
      msg: "Signin successfully",
      data: {
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        mail: foundUser.mail,
        username: foundUser.username,
        gender: foundUser.gender,
        dateOfBirth: foundUser.dateOfBirth,
        bio: foundUser.bio,
        posts: foundUser.posts,
        followers: foundUser.followers,
        following: foundUser.following,
        blocked: foundUser.blocked,
        isPrivate: foundUser.isPrivate,
        profilePicture: foundUser.profilePicture,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});


//LOGOUT
router.post('/auth/logout', async (req, res) => {
  try {
    res.cookie("jwt-token",null).status(200).json({ msg: "User logged out successfully" });
  } catch (error) {
    res.status(400).json({ error: "Something went wrong during logout" });
  }
});


module.exports = { router };
