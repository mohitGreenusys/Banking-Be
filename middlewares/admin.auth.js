// import jwt from "jsonwebtoken";
// import mongoose from "mongoose";
// import admin from "../models/admin.model.js";
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const admin = require("../models/admin.model.js");

const auth = async (req, res, next) => {
  try {
    if (!req.headers.authorization)
      return res.status(401).send({ error: "Unauthorized" });

    const token = req.headers.authorization.split(" ")[1];

    //check expired token
    // const decodedToken = jwt.decode(token);

    if (token) {
      const decodedData = jwt.verify(token, process.env.JWT_SECRET);
      const id = decodedData?.id;
      const role = decodedData?.role;
      if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(404).json({ error: "No user with that id" });

      const user = await admin.findById(id);
      if (!user) return res.status(404).json({ error: "User not found" });
      req.role = role;
      req.userId = id;
      next();
    } else {
      return res.status(401).send({ error: "Found Unauthorized" });
    }
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

// export default auth;
module.exports = auth;
