// import mongoose from "mongoose";
const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // inital loan amount
  amount: {
    type: Number,
    required: true,
  },
  //term in months and initally decided terms 
  term: {
    type: Number,
    required: true,
  },
  //loan type
  interest: {
    type: String,
    emum: ["Compound Interest", "Simple Interest","Reducing Interest"],
  },
  interestRate: {
    type: Number,
    default: 10,
  },
  // upcomming EMI amount status and date
  upcommingEMI: {
    type: Object,
  },
  totalAmount: {
    type: Number,
  },
  //repayment term in months
  repaymentterm: {
    type: Number ,
    default: 1,
    // required: true,
  },
  // emi amount
  repaymentAmount: {
    type: Number,
  },
  modeOfPayment: {
    type: String,
    enum: ["Bank Transfer", "Other", "Cash"],
    default: "Bank Transfer",
  },
  giventransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
  },
  repaymenttransactionId: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Transaction",
  },
  dueEMI : {
    type: [],
    default: [],
  },
  status: {
    type: String,
    enum: ["Pending", "Declined", "Paid", "Active", "Closed", "Default","PendingByAdmin"],
    default: "Pending",
  },
  loanDetails: {
    type: Array,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  BankAccountDetails: {
    type: Object,
  },
  remark: {
    type: String,
  },
});

// export default mongoose.model("Loan", loanSchema);
module.exports = mongoose.model("Loan", loanSchema);
