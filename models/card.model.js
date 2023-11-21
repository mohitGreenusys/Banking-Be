// import mongoose from "mongoose";
const mongoose = require("mongoose");

const Card = mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    number:{
        type: String,
        required: true,
    },
    cvv:{
        type: Number,
        required: true,
    },
    expires:{
        type: String,
        required: true
    }
}) 

// export default mongoose.model("Card", Card);
module.exports = mongoose.model("Card", Card);
