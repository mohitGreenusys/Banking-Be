// import mongoose from "mongoose";
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
  },
  transactionType: {
    type: String,
    enum: [
      "Deposit",
      "Withdraw",
      "LoanGiven",// deposit(user)
      "LoanPaid", //withdraw(user)
      "Investment", // deposit(user)
      "LoanRepayment", // withdraw(user)
    ],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  modeofpayment: {
    type: String,
    enum: ["Cash", "Cheque", "Bank Transfer"],
    default: "Cash",
    required: true,
  },
  remark: {
    type: String,
  },
});

// export default mongoose.model("Transaction", transactionSchema);
module.exports = mongoose.model("Transaction", transactionSchema);