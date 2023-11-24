// import express from "express";
// import adminController from "../controllers/admin.controllers.js";
// import adminauth from "../middlewares/admin.auth.js";
// import multer from "multer";

const express = require("express");
const adminController = require("../controllers/admin.controllers.js");
const adminauth = require("../middlewares/admin.auth.js");
const multer = require("multer");

const router = express.Router();

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

router.post("/login", adminController.login);
router.post("/register", adminController.register);

// ----------------------------------------------Dashboard Details------------------------------------------------ //
router.get("/statsdashboard", adminauth, adminController.getdashboard);
router.get("/userbasedgender", adminauth, adminController.userbasedongender);
router.get("/userbasedjoining", adminauth, adminController.userbasedonjoining);
router.get("/notification", adminauth, adminController.notify);

// ----------------------------------------------User Details------------------------------------------------ //
router.get("/allusers", adminauth, adminController.getalluser);
router.get("/user/:id", adminauth, adminController.getuser);
router.post("/adduser", adminauth, adminController.createuser);
router.post("/verifyotp/:id", adminauth, adminController.verifyuser);
router.post(
  "/sendpwdlink/:id",
  adminauth,
  uploadDocument.single("document"),
  adminController.sendpasslink
);
router.post("/setsavingpro/:id", adminauth, adminController.setsavingpro);

// ----------------------------------------------Loan Details------------------------------------------------ //
router.get("/loan/:id", adminauth, adminController.getloanbyid);
router.get("/pendingloan", adminauth, adminController.getpendingloan);
router.get("/approvedloan", adminauth, adminController.getapprovedloan);
router.get("/rejectedloan", adminauth, adminController.getrejectedloan);
router.get("/loanbyuser/:id", adminauth, adminController.loanlistbyuser);
router.get("/allloanuser", adminauth, adminController.loanmemberlist);
router.post(
  "/loanSimpleInterest/:id",
  adminController.createLoanSimpleInterest
);
router.post(
  "/loanReducingInterest/:id",
  adminController.createLoanReducingInterest
);

// router.post("/addloan/:userid", adminauth, adminController.createloan);
router.get("/approveLoan/:id", adminauth, adminController.approveLoanByManager);
router.post("/addpayment/:id", adminauth, adminController.addpaymentmethod);
router.get("/creditLoan/:id", adminauth, adminController.approveloan);
router.get("/reject/:id", adminauth, adminController.rejectloan);

// ----------------------------------------------Investment Details------------------------------------------------ //
router.get(
  "/withdrawlInvestmentsRequests",
  adminauth,
  adminController.withdrawInvestment
);
router.get(
  "/approveWithdraw/:id",
  adminauth,
  adminController.approveWithdrawlRequest
);
router.get(
  "/deleteWithdraw/:id",
  adminauth,
  adminController.rejectWithdrawlRequest
);
router.get(
  "/releaseFixedInterest",
  adminauth,
  adminController.releaseInvestmentInterestFixedInterest
);
router.get("/releaseProfitShare",adminauth,adminController.releaseInvestmentInterestShareProfit
);

router.get("/allinvestment", adminauth, adminController.getinvestment);
router.get("/investment/:id", adminauth, adminController.getinvestmentbyuser);

// ----------------------------------------------Transaction Details------------------------------------------------ //

router.get("/gettransaction/:range", adminauth, adminController.gettransaction);
router.get("/userTranstion/:id",adminauth, adminController.userTranstionDetail)

// ----------------------------------------------Customer Support------------------------------------------------ //
router.get("/alltickets", adminauth, adminController.getCustomerSupport);
router.get("/tickets/:id", adminauth, adminController.getCustomerSupportById);
router.post(
  "/pendingtickets",
  adminauth,
  adminController.getPendingCustomerSupport
);

// ----------------------------------------------Admin Details------------------------------------------------ //
router.get("/mydetails", adminauth, adminController.getadmintrans);

// export default router;
module.exports = router;
