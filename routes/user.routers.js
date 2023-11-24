// import express from "express";
// import userController from "./../controllers/user.controller.js";
// import Userauth from "../middlewares/user.auth.js";
// import multer from "multer";

const express = require("express");
const userController = require("./../controllers/user.controller.js");
const Userauth = require("../middlewares/user.auth.js");
const multer = require("multer");

const router = express.Router();

// Define multer storage for images
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Set the destination directory where images will be stored
    cb(null, "files/profileImages");
  },
  filename: function (req, file, cb) {
    // Set the file name for the uploaded image
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      req.userId +
        "-" +
        file.fieldname +
        "-" +
        uniqueSuffix +
        "." +
        file.originalname.split(".").pop()
    );
  },
});

// Create a multer instance for image uploads
const uploadImage = multer({ storage: imageStorage });

// Define multer storage for documents
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Set the destination directory where documents will be stored
    cb(null, "files/documents");
  },
  filename: function (req, file, cb) {
    // Set the file name for the uploaded document
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      req.params.id +
        "-" +
        file.fieldname +
        "-" +
        uniqueSuffix +
        "." +
        file.originalname.split(".").pop()
    );
  },
});

// Create a multer instance for document uploads
const uploadDocument = multer({ storage: documentStorage });

//------------------login signup------------------//

router.post("/signin", userController.login);
router.post("/signup", userController.signup);
router.post("/verifyOtp/:id", userController.verfyOtp);
router.post("/addPassword/:id", userController.addPassword);
router.get("/resendOtp/:id", userController.resendOtp);

router.post("forgetbyId/:id", userController.forgetPasswordById);

// Upload document using the "uploadDocument" middleware
router.post(
  "/uploadDoc/:id",
  uploadDocument.single("document"),
  userController.submitDocument
);

router.post("/forgotPassword", userController.forgotPassword);
router.post("/verifyOtpForgotPassword", userController.setforgotPassword);

//------------------user------------------//

router.get("/getuser", Userauth, userController.getUser);
router.post("/addBankDetails", Userauth, userController.AddBankDetails);
router.get("/balance", Userauth, userController.getBalance);
router.post(
  "/profileImage",
  Userauth,
  uploadImage.single("image"),
  userController.uploadImage
);
router.post("/contactSupport", Userauth, userController.customerSupport);
router.get("/getTransactions", Userauth, userController.getTransactions);

//------------------card------------------//

router.get("/card", Userauth, userController.getCard);
router.post("/addCard", Userauth, userController.addCard);
router.get("/removeCard", Userauth, userController.removeCard);

//------------------transaction------------------//

router.get("/Withdrawtrans", Userauth, userController.Withdrawtransaction);
router.get("/deposittrans", Userauth, userController.depositransaction);

//------------------saving------------------//

router.post("/chooseProduct", Userauth, userController.SavingProduct);

//------------------investment------------------//

router.get("/investment", Userauth, userController.InvestmentDetails);
router.get("/investedAmount", Userauth, userController.investDetails);
router.post("/depositInvestment", Userauth, userController.depositInvestment);
router.post("/withdrawInvestment", Userauth, userController.withdrawInvestment);
router.get("/notification", Userauth, userController.notification);
router.post("/savingCalculator",userController.savingCalculator);

//------------------loan------------------//
router.get("/interestRate", Userauth, userController.interestRate);
router.get("/loans", Userauth, userController.getLoans);
router.get("/loan/:id", Userauth, userController.getLoanById);
router.post(
  "/loanSimpleInterest",
  Userauth,
  userController.createLoanSimpleInterest
);
router.post(
  "/loanReducingInterest",
  Userauth,
  userController.createLoanReducingInterest
);
router.post(
  "/loanCompoundInterest",
  Userauth,
  userController.createLoanCompoundInterest
);
router.get(
  "/loanTransactions/:id",
  Userauth,
  userController.getLoanTransactions
);

router.get("/remainingBalance/:id", userController.totalRemainingBalance);
router.post("/totalRemainingPay",Userauth,userController.totalRemainingPay)
router.post("/payemi", Userauth, userController.payEMI);
router.post("/payDueEmi", Userauth, userController.payDueEMI);

// export default router;
module.exports = router;
