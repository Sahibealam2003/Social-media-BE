const mongoose = require("mongoose");
const validator = require("validator");

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
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    minlength: 2,
    maxlength: 15,
    trim: true,
    required: true,
  },
  lastName: {
    type: String,
    minlength: 2,
    maxlength: 15,
    trim: true,
    required: true,
  },
  username: {
    type: String,
    minlength: 2,
    maxlength: 15,
    trim: true,
    required: true,
    unique: true,
    lowercase: true,
  },
  mail: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    validate(val) {
      if (!validator.isEmail(val)) {
        throw new Error("Please enter a valid email address(User Schema)");
      }
    },
  },
  password: {
    type: String,
    minlength: 8,
    trim: true,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
    validate : function (val) {
      const isDate= validator.isDate(val)
      if(!isDate){
        throw new Error("Please enter a valid date")
      }
      const age = getAgeFromDOB(val.toISOString());
      if (age < 18) {
        throw new Error("You must be at least 18 years old(User Schema)");
      }
    },
  },
  gender: {
    type: String,
    enum: {
      values: ["male", "female", "other"],
      message: "{VALUE} is not a valid gender",
    },
    trim: true,
    required: true,
  },
  bio: {
    type: String,
    trim: true,
    minlength: 4,
    maxlength: 200,
  },
  profilePicture: {
    type: String
  },
  posts: [],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  blocked: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isPrivate: {
    type: Boolean,
    default: false,
  },
},{timestamps : true});

const User = mongoose.model("User", userSchema);
module.exports = { User };
