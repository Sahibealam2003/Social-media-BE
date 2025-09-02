const mongoose = require("mongoose");

// Define the schema for follow requests
const followRequestSchema = new mongoose.Schema({
  
  // User who sends the follow request
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    immutable: true, // Once created, cannot be changed
    ref: "User" // Reference to User model
  },

  // User who receives the follow request
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    immutable: true, // Once created, cannot be changed
    ref: "User" // Reference to User model
  },

  // Status of the follow request
  status: {
    type: String,
    required: true,
    enum: {
      values: ["accepted", "rejected", "pending"], // Allowed values only
      message: "{VALUE} is not a valid status for follow request" // Custom error if invalid value
    }
  }
});

// Create model from schema
const FollowRequest = mongoose.model("FollowRequest", followRequestSchema);

// Export model for use in other files
module.exports = {
  FollowRequest
};
