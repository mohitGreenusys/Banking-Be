// import jwt from "jsonwebtoken";
// import mongoose from "mongoose";
// import UserModels from "../models/user.model.js";

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const UserModels = require("../models/user.model.js");

const auth = async (req, res, next) => {
  try {
    if (!req.headers.authorization)
      return res.status(401).send({ error: "Unauthorized" });

    const token = req.headers.authorization.split(" ")[1];

   

    if (token) {

      const decodedData = jwt.verify(token, process.env.JWT_SECRET);
      const id = decodedData?.id;
      // console.log(id,"token")
      if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(404).json({ error: "No user with that id" });

      const user = await UserModels.findById(id);
      if (!user) return res.status(404).json({ error: "User not found" });

      req.userId = id;
      next();
    } else {
      return res.status(401).send({ error: "Found Unauthorized" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong || jwt error" });
  }
};

// export default auth;
module.exports = auth;
