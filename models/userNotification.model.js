// import mongoose from "mongoose";
const mongoose = require("mongoose");

const userNotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  notificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Notification",
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// export default mongoose.model("UserNotification", userNotificationSchema);
module.exports = mongoose.model("UserNotification", userNotificationSchema);