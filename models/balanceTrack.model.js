// import mongoose from "mongoose";
const mongoose = require("mongoose");

const balanceTrackSchema =  mongoose.Schema({
    month: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    // balance: {
    //     type: Number,
    //     required: true,
    // },
    totalInterestEarned: {
        type: Number,
        required: true,
    },
    totalActiveLoan: {
        type: Number,
        required: true,
    },
    totalInvestment: {
        type: Number,
        required: true,
    },
    totalLoanRepayment: {
        type: Number,
        required: true,
    }

});

// export default mongoose.model("BalanceTrack", balanceTrackSchema);
module.exports = mongoose.model("BalanceTrack", balanceTrackSchema);