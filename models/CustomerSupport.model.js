// import mongoose from "mongoose";
const mongoose = require("mongoose");

const CustomerSupportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Resolved"],
    default: "Pending",
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// export default mongoose.model("CustomerSupport", CustomerSupportSchema);
module.exports = mongoose.model("CustomerSupport", CustomerSupportSchema);
