// import mongoose from "mongoose";
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
    unique: [true, "Mobile number already exists"],
  },
  email: {
    type: String,
    required: true,
    unique: [true, "Email already exists"],
  },
  password: {
    type: String,
    length: [6, "Password must be at least 6 characters"],
  },
  gender: {
    type: String,
  },
  dob: {
    type: Date,
  },
  joiningDate: {
    type: Date,
    default: Date.now,
  },
  otp: {
    type: Number,
    required: true,
  },
  otpVerified: {
    type: Boolean,
    default: false,
  },
  otpExpires: {
    type: Date,
    required: true,
  },
  image:{
    type: String,
  },
  document: {
    type: String,
  },
  documentNumber:{
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  savingProduct: {
    type: String,
    enum: ["shareProfit", "setInterest"],
  },
  balance: {
    type: Number,
    default: 0,
  },
  totalProfit: {
    type: Number,
    default: 0,
  },
  bankDetails: {
    type: Object,
    default: null,
  },
  transactions: {
    type: Array,
    default: [],
    ref: "Transaction",
  },
  loan: {
    type: Array,
    default: [],
    ref: "Loan",
  },
  investment: {
    type: Array,
    default: [],
    ref: "Investment",
  },
  card:{
    type: Object,
    default:null,
    ref: "Card"
  },
  notification:{
    type: Array,
    default:[],
    ref:"Notification",
  }
});

// export default mongoose.model("User", userSchema);
module.exports = mongoose.model("User", userSchema);
