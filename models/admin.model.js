// import mongoose from "mongoose";
const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: [true, "Email already exists"],
  },
  password: {
    type: String,
    required: true,
    length: [6, "Password must be at least 6 characters"],
  },
  balance: {
    type: Number,
    default: 0,
  },
  interestOnInvestment: {
    type: Number,
    default: 10,
  },
  interestRateSimple: {
    type: Number,
    default: 10,
  },
  interestRateReducing: {
    type: Number,
    default: 10,
  },
  role: {
    type: String,
    enum: ["Admin", "Manager"],
    default: "Manager",
  },
  loanGiven: {
    type: Array,
    default: [],
    ref: "Loan",
  },
  loanPaid: {
    type: Array,
    default: [],
    ref: "Loan",
  },
  investment: {
    type: Array,
    default: [],
    ref: "Investment",
  },
  transactions: {
    type: Array,
    default: [],
    ref: "Transaction",
  },
  withdrawlRequests: {
    type: Array,
    default: [],
    ref: "WithdrawlRequest",
  },
});

// export default mongoose.model("Admin", adminSchema);
module.exports = mongoose.model("Admin", adminSchema);
