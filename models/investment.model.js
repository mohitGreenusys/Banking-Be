// import mongoose from "mongoose";
const mongoose = require("mongoose");

const investmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  interestEarned:{
    type: Number,
    default: 0,
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
  },
  transactionType: {
    type: String,
    required: true,
  },
  savingProduct: {
    type: String,
    required: true,
    enum:["shareProfit", "setInterest"]
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  remark: {
    type: String,
  },
  status: {
    type: String,
    default: "Active",
    enum: ["Pending", "Active", "Completed", "Rejected","Withdrawn"],
  },
});

// export default mongoose.model("Investment", investmentSchema);
module.exports = mongoose.model("Investment", investmentSchema);
