// import mongoose from "mongoose";
const mongoose = require("mongoose");

const withdrawlRequestSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  bankDetails: {
    type: Object,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

// export default mongoose.model("WithdrawlRequest", withdrawlRequestSchema);
module.exports = mongoose.model("WithdrawlRequest", withdrawlRequestSchema);
