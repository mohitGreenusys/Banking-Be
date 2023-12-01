// import bcrpyt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import UserModel from "../models/user.model.js";
// import sendOTP from "../utils/sendOTP.utils.js";
// import cardModel from "../models/card.model.js";
// import transactionModel from "../models/transaction.model.js";
// import investmentModel from "../models/investment.model.js";
// import notificationModel from "../models/notification.model.js";
// import loanModel from "../models/loan.model.js";
// import fs from "fs";
// import CustomerSupportModel from "../models/CustomerSupport.model.js";
// import userModel from "../models/user.model.js";
// import adminModel from "../models/admin.model.js";
// import balanceTrackModel from "../models/balanceTrack.model.js";
// import withdrawlRequestsModel from "../models/withdrawlRequests.model.js";

const bcrpyt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model.js");
const sendOTP = require("../utils/sendOTP.utils.js");
const cardModel = require("../models/card.model.js");
const transactionModel = require("../models/transaction.model.js");
const investmentModel = require("../models/investment.model.js");
const notificationModel = require("../models/notification.model.js");
const loanModel = require("../models/loan.model.js");
const fs = require("fs");
const CustomerSupportModel = require("../models/CustomerSupport.model.js");
const userModel = require("../models/user.model.js");
// const UserModel = require("../models/user.model.js");
const adminModel = require("../models/admin.model.js");
const balanceTrackModel = require("../models/balanceTrack.model.js");
const withdrawlRequestsModel = require("../models/withdrawlRequests.model.js");

const routes = {};

routes.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email }).select(
      "-loan -investment -transactions -document -__v"
    );
    if (!user) return res.status(200).json({ error: "User not found" });

    if (!user.isVerified)
      return res
        .status(200)
        .json({ error: "User not verified. follow the signup process again" });

    if (!user.password)
      return res.status(200).json({ error: "User don't have password" });

    const isMatch = await bcrpyt.compare(password, user.password);
    if (!isMatch) return res.status(200).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.status(200).json({ result: user, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.signup = async (req, res) => {
  const { name, email, mobile, gender, dob } = req.body;
  try {
    const ifUser = await UserModel.findOne({ email });
    if (ifUser && ifUser.isVerified)
      return res.status(200).json({ error: "User already exists" });

    // unique number
    // const uniqueNumberid = await UserModel.find({ mobile: mobile });

    // if (uniqueNumberid.length > 0)
    //   return res.status(200).json({ error: "Mobile number already exists" });

    if (ifUser && !ifUser.isVerified)
      await UserModel.findByIdAndDelete(ifUser._id);

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = Date.now() + 10 * 60 * 1000;

    const otpresult = await sendOTP(email, otp, "Verify your email");

    if (!otpresult.messageId)
      return res.status(200).json({ error: "Something went wrong with OTP" });

    const result = await UserModel.create({
      name,
      email,
      mobile,
      gender,
      otp,
      otpExpires,
      dob,
    });

    res.status(201).json({
      _id: result._id,
      result,
      success: "OTP has been sent to your email",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.verfyOtp = async (req, res) => {
  const { id } = req.params;
  const otp = parseInt(req.body.otp);

  try {
    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.otpExpires < Date.now())
      return res.status(400).json({ error: "OTP expired" });

    if (user.otp != otp) return res.status(400).json({ error: "Invalid OTP" });

    user.otpVerified = true;
    await user.save();

    res.status(200).json({ success: "Verified" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.addPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.otpVerified)
      return res.status(404).json({ error: "User otp is not verified" });

    if (user.password) {
      return res.status(404).json({ error: "User already have password" });
    }

    const hashedPassword = await bcrpyt.hash(password, 12);

    user.password = hashedPassword;
    const result = await user.save();

    return res.status(200).json({ success: "Password saved" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.resendOtp = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.isVerified)
      return res.status(404).json({ error: "user already verified" });

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = Date.now() + 10 * 60 * 1000;

    const otpresult = await sendOTP(user.email, otp, "Verify your email");

    if (!otpresult.messageId)
      return res.status(500).json({ error: "Something went wrong with OTP" });

    user.otp = otp;
    user.otpExpires = otpExpires;

    await user.save();
    return res.status(201).json({ success: "OTP has been sent to your email" });
  } catch (error) {
    res.send(500).json({ error: "something went wrong" });
  }
};

routes.submitDocument = async (req, res) => {
  try {
    const { id } = req.params;
    // const { id } = req.body;
    const documentNumber = req.body.documentNumber;

    const document = req.file ? req.file.path : null;
    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ error: "user not found" });

    user.document = document;
    user.documentNumber = documentNumber;
    user.isVerified = true;
    await user.save();

    return res.status(200).json({ success: "document upload" });
  } catch (error) {
    console.log(error);
    return res.send(500).json({ error: "something went wrong" });
  }
};

routes.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.isVerified)
      return res.status(404).json({ error: "User not verified" });

    const otp = Math.floor(100000 + Math.random() * 900000);

    // generate a link to reset password and send to user email

    const otpresult = await sendOTP(email, otp, "Reset your password");

    if (!otpresult?.messageId)
      return res.status(500).json({ error: "Something went wrong with OTP" });

    user.otp = otp;

    user.otpExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    return res
      .status(200)
      .json({ success: "OTP has been sent to your email", id: user._id });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "something went wrong" });
  }
};

routes.setforgotPassword = async (req, res) => {
  try {
    const { password, otp, id } = req.body;

    const user = await UserModel.findById(id);

    if (!user) return res.status(200).json({ error: "User not found" });

    if (user.otpExpires < Date.now())
      return res.status(200).json({ error: "OTP expired" });

    if (user.otp != otp) return res.status(200).json({ error: "Invalid OTP" });

    const hashedPassword = await bcrpyt.hash(password, 12);

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({ success: "Password saved" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "something went wrong" });
  }
};

routes.forgetPasswordById = async (req, res) => {
  try {
    const { id } = req.params;

    const password = req.body.password;

    const user = await userModel.findById(id);

    if (!user) return res.status(404).json({ error: "User not found" });

    user.password = await bcrpyt.hash(password, 12);

    await user.save();

    return res.status(200).json({ success: "Password saved" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "something went wrong" });
  }
};

routes.getUser = async (req, res) => {
  try {
    const id = req.userId;

    const user = await UserModel.findById(id).select(
      "name mobile email gender dob image document bankDetails "
    );

    if (!user) return res.status(404).json({ error: "user not found" });

    return res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.AddBankDetails = async (req, res) => {
  try {
    const id = req.userId;

    const { bankName, accountNumber, ifscCode, AccountHolderName } = req.body;

    if (!bankName || !accountNumber || !ifscCode || !AccountHolderName)
      return res.status(404).json({ error: "all fields are required" });

    const user = await userModel.findById(id);

    if (!user) return res.status(404).json({ error: "user not found" });

    user.bankDetails = {
      bankName,
      accountNumber,
      ifscCode,
      AccountHolderName,
    };

    await user.save();

    return res.status(200).json({ success: "success" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "internal server error", error: error.message });
  }
};

routes.uploadImage = async (req, res) => {
  try {
    const id = req.userId;

    const image = req.file ? req.file.path : null;

    if (!image) return res.status(404).json({ error: "image not found" });

    const user = await UserModel.findById(id);

    if (user.image) {
      // Delete the old image from disk storage
      fs.unlink(user.image, (err) => {
        if (err) {
          console.error("Error deleting old image:", err);
          // Handle the error as needed
        }
      });
    }

    // Update the user's image field with the new image path
    user.image = image;
    await user.save();

    return res.status(200).json({ message: "Image uploaded successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.customerSupport = async (req, res) => {
  try {
    const id = req.userId;

    const { subject, message } = req.body;

    const newCustomerSupport = await CustomerSupportModel.create({
      user: id,
      subject,
      message,
    });

    const notification = await notificationModel.create({
      userId: id,
      title: "Customer Support",
      message: "Customer Support message sent successfully",
    });

    const user = await UserModel.findById(id);

    user.notification.push(notification.id);

    await user.save();

    return res.status(200).json({ success: "success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

routes.getTransactions = async (req, res) => {
  try {
    const id = req.userId;

    const user = await UserModel.findById(id).populate("transactions");
    if (!user) return res.status(404).json({ error: "user not found" });

    return res.status(200).json({ transactions: user?.transactions });
  } catch (error) {
    return res.status(500).json({ error: "something went wrong" });
  }
};

routes.getBalance = async (req, res) => {
  try {
    const id = req.userId;

    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ error: "user not found" });

    return res.status(200).json({
      Balance: user.balance,
      savingProduct: `${user.savingProduct} Product`,
    });
  } catch (error) {
    return res.status(500).json({ error: "something went wrong" });
  }
};

routes.getCard = async (req, res) => {
  try {
    const id = req.userId;

    if (!id) return res.status(200).json({ error: "user not found" });

    const user = await UserModel.findById(id);

    if (!user) return res.status(200).json({ error: "user not found" });

    if (user.card === null) {
      return res.status(200).json({ error: "user's card not found " });
    }

    const populatedUser = await UserModel.findById(id).populate("card");

    return res.status(200).json({ card: populatedUser.card });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "something went wrong" });
  }
};

routes.addCard = async (req, res) => {
  try {
    const id = req.userId;
    console.log(id);
    const { name, number, cvv, expires } = req.body;

    const user = await UserModel.findById(id);
    if (!user) return res.status(200).json({ error: "user not found" });

    if (user.card) {
      await cardModel.findByIdAndDelete(user.card._id);
      user.card = null;
      await user.save();
    }

    const card = await cardModel.create({ name, number, cvv, expires });
    user.card = card;

    const notificationdta = {
      userId: user.id,
      title: "card successfuly added",
      message: `card ${number} successfuly added`,
    };

    const newNotification = await notificationModel.create(notificationdta);

    user.notification.push(newNotification.id);

    const result = await user.save();
    return res.status(200).json({ card });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "something went wrong" });
  }
};

routes.removeCard = async (req, res) => {
  try {
    const id = req.userId;

    const user = await UserModel.findById(id);
    if (!user) return res.status(200).json({ error: "user not found" });

    if (!user.card) {
      return res.status(200).json({ error: "user don't have any card" });
    }

    await cardModel.findByIdAndDelete(user.card._id);
    user.card = null;
    await user.save();
    return res.status(200).json({ success: "card removed" });
  } catch (error) {
    return res.status(500).json({ error: "something went wrong" });
  }
};

routes.Withdrawtransaction = async (req, res) => {
  try {
    const id = req.userId;

    const user = await UserModel.findById(id).populate({
      path: "transactions",
      match: {
        // transactionType: { $in: ["Withdraw", "LoanPaid", "LoanRepayment"] },
        transactionType: { $in: ["Withdraw"] },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({ transactions: user.transactions });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.depositransaction = async (req, res) => {
  try {
    const id = req.userId;

    const user = await UserModel.findById(id).populate({
      path: "transactions",
      match: {
        transactionType: { $in: ["Deposit", "Investment"] },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({ transactions: user.transactions });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.SavingProduct = async (req, res) => {
  try {
    const id = req.userId;
    const { type } = req.body;

    if (type !== "setInterest" && type !== "shareProfit")
      return res.status(404).json({ error: "type is invalid required" });

    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.savingProduct = type;

    await user.save();

    return res.status(200).json({ success: "success" });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.InvestmentDetails = async (req, res) => {
  try {
    const id = req.userId;

    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.investment)
      return res.status(404).json({ error: "User don't have any investment" });
    //user.investments is an array of investment ids
    const investments = await investmentModel.find({
      _id: { $in: user.investment },
    });

    return res.status(200).json({ investments });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.depositInvestment = async (req, res) => {
  try {
    const id = req.userId;
    const { amount, modeofpayment, transactionId } = req.body;
    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const Amount = parseInt(amount);

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const balanceTrack = await balanceTrackModel.findOne({
      month: currentMonth,
      year: currentYear,
    });

    // if not found create a new one

    if (!balanceTrack) {
      const activeLoan = await loanModel.find({
        status: { $in: ["Default", "Active"] },
      });

      var activeLoanAmount = 0;

      activeLoan.map((loan) => {
        activeLoanAmount += loan.totalAmount;
      });

      var activeInvestmentAmount = 0;

      const activeInvestment = await investmentModel.find({ status: "Active" });

      activeInvestment.map((investment) => {
        activeInvestmentAmount += investment.amount;
      });

      const newBalanceTrack = await balanceTrackModel.create({
        month: currentMonth,
        year: currentYear,
        totalInterestEarned: 0,
        totalActiveLoan: activeLoanAmount,
        totalInvestment: activeInvestmentAmount + Amount,
        totalLoanRepayment: 0,
      });
    } else {
      (balanceTrack.totalInvestment += Amount), await balanceTrack.save();
    }

    const dta = {
      userId: user._id,
      amount: Amount,
      transactionType: "Investment",
      savingProduct: user.savingProduct,
    };

    const newinvestment = new investmentModel(dta);
    await newinvestment.save();

    user.investment.push(newinvestment._id);

    const transactiondta = {
      userId: user._id,
      amount: Amount,
      transactionType: "Investment",
      transactionId: transactionId
        ? transactionId
        : Math.floor(100000000 + Math.random() * 900000000),
    };

    const newtransaction = new transactionModel(transactiondta);

    await newtransaction.save();

    user.transactions.push(newtransaction._id);

    user.balance += Amount;

    const admin = await adminModel.findOne({ role: "Admin" });

    if (!admin) return res.status(404).json({ error: "Admin not found" });

    admin.balance += Amount;

    await admin.save();

    // const currentMonth = new Date().getMonth() + 1;
    // const currentYear = new Date().getFullYear();

    // var balanceTrack = await balanceTrackModel.findOne({
    //   month: currentMonth,
    //   year: currentYear,
    // });

    // if (!balanceTrack) {
    //   const previousBalanceTrack = await balanceTrackModel.find();
    //   var lastBalanceTrack;
    //   if (previousBalanceTrack.length > 0) {
    //     lastBalanceTrack =
    //       previousBalanceTrack[previousBalanceTrack.length - 1];
    //   }
    //   const newBalanceTrack = await balanceTrackModel.create({
    //     month: currentMonth,
    //     year: currentYear,
    //     totalInterestEarned: 0,
    //     totalActiveLoan: lastBalanceTrack
    //       ? lastBalanceTrack.totalActiveLoan
    //       : 0,
    //     totalInvestment: lastBalanceTrack
    //       ? lastBalanceTrack.totalInvestment + Amount
    //       : Amount,
    //     totalLoanRepayment: 0,
    //   });

    //   balanceTrack = newBalanceTrack;
    // } else {
    //   balanceTrack.totalInvestment += Amount;
    // }

    // await balanceTrack.save();

    const notificationdta = {
      userId: user.id,
      title: "Successfull Deposit",
      message: `${amount} Successfull Deposit to investment`,
    };

    const newNotification = await notificationModel.create(notificationdta);

    user.notification.push(newNotification.id);

    await user.save();

    return res.status(200).json({
      currentBalance: user.balance,
      investment: newinvestment,
      transaction: newtransaction,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.investDetails = async (req, res) => {
  try {
    const id = req.userId;

    const investments = await investmentModel.find({ userId: id });

    var totalInvestment = 0;
    var totalInterest = 0;

    if (investments.length < 1) {
      return res.status(200).json({ totalInterest, totalInvestment });
    }

    investments.map((item) => {
      totalInterest += item.interestEarned;
      totalInvestment += item.amount;
    });

    return res.status(200).json({ totalInterest, totalInvestment });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "something went wrong" });
  }
};

routes.withdrawInvestment = async (req, res) => {
  try {
    const id = req.userId;
    const { amount, transactionId, modeofpayment } = req.body;
    const user = await UserModel.findById(id);
    if (!user) return res.status(200).json({ error: "User not found" });

    if (amount > user.balance)
      return res
        .status(200)
        .json({ error: "amount is greater than current balance" });

    if (!user.bankDetails) {
      console.log(user.bankDetails);
      return res.status(200).json({
        error: "Please add your bank Details in Personal Information Section",
      });
    }

    if (!user.investment)
      return res.status(200).json({ error: "User don't have any investment" });

    const Amount = parseInt(amount);

    const withdrawlRequest = {
      user: user._id,
      amount: Amount,
      bankDetails: user.bankDetails,
    };

    const newWithdrawlRequest = await withdrawlRequestsModel.create(
      withdrawlRequest
    );

    const admin = await adminModel.findOne({ role: "Admin" });

    if (!admin) return res.status(200).json({ error: "Admin not found" });

    admin.withdrawlRequests.push(newWithdrawlRequest._id);

    await admin.save();

    const notificationdta = {
      userId: user.id,
      title: "Successfull Withdraw Rerquest",
      message: `${amount} will be withdrawl from Account`,
    };

    const newNotification = await notificationModel.create(notificationdta);
    user.notification.push(newNotification.id);
    await user.save();

    return res.status(200).json({ currentBalance: user.balance });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.savingCalculator = async (req, res) => {
  try {
    const { Amount, type, duration } = req.body;

    if (
      typeof Amount !== "number" ||
      typeof type !== "string" ||
      typeof duration !== "number"
    ) {
      return res.status(400).json({ error: "Invalid input values" });
    }

    const Admins = await adminModel.find({ role: "Admin" });

    const admin = Admins[0];

    var interestRate;

    if (type === "Simple Interest") {
      interestRate = admin.interestRateSimple;
      var Term = parseInt(duration);
      if (Term < 12) {
        Term = 12;
      }
      const totalAmount = Amount + (Amount * interestRate * Term) / 1200;

      return res.status(200).json({ totalAmount });
    } else if (type === "Reducing Interest") {
      interestRate = admin.interestRateReducing;

      // const Amount = parseInt(amount);
      var Term = parseInt(duration);
      // if (Term < 12) {
      //   Term = 12;
      // }
      const InterestRate = parseFloat(interestRate / 12);
      console.log(Term);
      // Calculate the monthly payment
      const monthlyInterestRate = InterestRate / 100;

      console.log(monthlyInterestRate);

      const monthlyPayment = Math.round(
        Amount *
          (monthlyInterestRate / (1 - Math.pow(1 + monthlyInterestRate, -Term)))
      );

      const totalAmount = Term * monthlyPayment;

      return res.status(200).json({ totalAmount });
    }

    const principal = Amount; // Loan amount
    const rate = 10 / 100; // yearly interest rate
    const numberOfPayments = parseInt(duration); // Total number of payments (months)

    const emi = parseFloat(
      (
        (principal * rate * Math.pow(1 + rate, numberOfPayments)) /
        (Math.pow(1 + rate, numberOfPayments) - 1)
      ).toFixed(2)
    );



    return res.status(200).json({ totalAmount: emi * numberOfPayments });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.notification = async (req, res) => {
  try {
    const id = req.userId;
    const user = await UserModel.findById(id).populate("notification");
    if (!user) return res.status(404).json({ error: "User not found" });

    const notification = user.notification.reverse();

    return res.status(200).json({ result: notification });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.interestRate = async (req, res) => {
  try {
    const admin = await adminModel.findOne({ role: "Admin" });

    if (!admin) return res.status(404).json({ error: "Admin not found" });

    return res.status(200).json({
      simpleInterest: admin.interestRateSimple,
      reducingInterest: admin.interestRateReducing,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.createLoanSimpleInterest = async (req, res) => {
  try {
    const id = req.userId;
    const { amount, term, interest, remark, BankAccountDetails } = req.body;

    const user = await UserModel.findById(id);
    console.log(user);

    if (!user) return res.status(404).json({ error: "User not found" });

    user?.loan?.map((loan) => {
      if (loan.status === "Default" || loan.status === "Active") {
        return res.status(404).json({ error: "User already have loan" });
      }
    });

    if(user.balance < 1){
    return res.status(200).json({message:"Please do investment to take Loan"})
    }

    const Amount = parseInt(amount);

    if(Amount > 3*user.balance){
      return res.status(200).json({message:"You can only take a Loan of 3X of your balance"})
    }
    const admin = await adminModel.findOne({ role: "Admin" });

    const interestRate = admin.interestRateSimple;


    const Term = parseInt(term);
    const InterestRate = parseFloat(interestRate);

    var totalAmount = 0;

    if(Term < 12){
      totalAmount =
      Amount + parseInt(((Amount * interestRate * 12) / 1200).toFixed(2));
    }else{
      totalAmount =
      Amount + parseInt(((Amount * interestRate * Term) / 1200).toFixed(2));
    }

    const repaymentAmount = Math.round(totalAmount / Term);
    let balance = totalAmount;

    const loanDetails = [];

    // Calculate the loan details for each month
    for (let month = 1; month <= Term; month++) {
      const interestPayment = parseFloat(((InterestRate * Amount) / 1200).toFixed(2));
      // const principalPayment = repaymentAmount - interestPayment;
      // balance -= principalPayment;

      balance -= repaymentAmount;

      const installment = {
        month,
        interestPayment,
        principalPayment: repaymentAmount - interestPayment,
        totalPayment:
          month === Term ? repaymentAmount + balance : repaymentAmount,
        remainingBalance: month === Term ? 0 : balance,
      };

      loanDetails.push(installment);
    }

    const data = {
      user: user._id,
      amount: Amount,
      term: Term,
      interest,
      interestRate: InterestRate,
      totalAmount,
      repaymentAmount,
      remark,
      loanDetails,
      BankAccountDetails,
      modeOfPayment: "Bank Transfer",
    };
    const newloan = new loanModel(data);

    await newloan.save();

    user.loan.push(newloan._id);
    const result = await user.save();

    return res.status(200).json({ loan: newloan });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.createLoanReducingInterest = async (req, res) => {
  try {
    const id = req.userId;
    const { amount, term, interest, remark, BankAccountDetails } = req.body;

    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user?.loan?.map((loan) => {
      if (loan.status === "Default" || loan.status === "Active") {
        return res.status(404).json({ error: "User already have loan" });
      }
    });

    
    if(user.balance < 1){
      return res.status(200).json({message:"Please do investment to take Loan"})
      }
  
      const Amount = parseInt(amount);
  
      if(Amount > 3*user.balance){
        return res.status(200).json({message:"You can only take a Loan of 3X of your balance"})
      }

    const admin = await adminModel.findOne({ role: "Admin" });

    const interestRate = admin.interestRateReducing;

    var Term = parseInt(term);
    const InterestRate = parseFloat((interestRate / 12).toFixed(3));

    // Calculate the monthly payment
    const monthlyInterestRate = InterestRate / 100;


    const  monthlyPayment = Math.round(
        Amount *
          (monthlyInterestRate / (1 - Math.pow(1 + monthlyInterestRate, -Term)))
      );


    console.log(monthlyPayment)

    // Initialize the loan balance
    let balance = Amount;
    const loanDetails = [];

    // Calculate the loan details for each month
    for (let month = 1; month <= Term; month++) {
      const interestPayment = balance * monthlyInterestRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      const installment = {
        month,
        principalPayment,
        interestPayment,
        totalPayment: monthlyPayment,
        remainingBalance: balance,
      };

      loanDetails.push(installment);
    }

    const data = {
      user: user._id,
      amount: Amount,
      term: Term,
      interest,
      interestRate: interestRate,
      totalAmount: monthlyPayment * Term,
      repaymentAmount: monthlyPayment,
      remark,
      loanDetails,
      BankAccountDetails,
      modeOfPayment: "Bank Transfer",
    };

    const newLoan = new loanModel(data);

    await newLoan.save();

    user.loan.push(newLoan._id);
    const result = await user.save();

    return res.status(200).json({ loan: newLoan });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.createLoanCompoundInterest = async (req, res) => {
  try {
    const id = req.userId;
    const { amount, term, interest, remark, BankAccountDetails } = req.body;

    const user = await UserModel.findById(id);
    console.log(user);

    if (!user) return res.status(404).json({ error: "User not found" });

    user?.loan?.map((loan) => {
      if (loan.status === "Default" || loan.status === "Active") {
        return res.status(404).json({ error: "User already have loan" });
      }
    });

    
    if(user.balance < 1){
      return res.status(200).json({message:"Please do investment to take Loan"})
      }
  
      const Amount = parseInt(amount);
  
      if(Amount > 3*user.balance){
        return res.status(200).json({message:"You can only take a Loan of 3X of your balance"})
      }

    const admin = await adminModel.findOne({ role: "Admin" });

    // const interestRate = admin.interestRateCompound;
    const interestRate = 10;


    const Term = parseInt(term);
    // const InterestRate = parseFloat(interestRate);

    // const InterestRate = 0.1; // 10% as a decimal
    // const compoundingFrequency = 12; // Monthly compounding
    // // console.log("called")
    // const monthlyInterestRate = InterestRate / compoundingFrequency;
    // const totalAmount =
    //   Amount *
    //   Math.pow(
    //     1 + monthlyInterestRate,
    //     compoundingFrequency * (Term / compoundingFrequency)
    //   );

    const principal = Amount; // Loan amount
    const rate = interestRate / 100; // yearly interest rate
    const numberOfPayments = Term; // Total number of payments (months)

    // Calculate EMI (Equated Monthly Installment)
    const emi = parseFloat(
      (
        (principal * rate * Math.pow(1 + rate, numberOfPayments)) /
        (Math.pow(1 + rate, numberOfPayments) - 1)
      ).toFixed(2)
    );

    let remainingBalance = principal;
    const loanDetails = [];

    // Calculate the loan details for each month
    for (let month = 1; month <= numberOfPayments; month++) {
      const interestPayment = parseFloat((remainingBalance * rate).toFixed(2));
      const principalPayment = parseFloat((emi - interestPayment).toFixed(2));
      remainingBalance -= principalPayment;

      const installment = {
        month,
        principalPayment,
        interestPayment,
        totalPayment: emi,
        remainingBalance: parseFloat(remainingBalance.toFixed(2)), // Rounded to two decimal places
      };

      loanDetails.push(installment);
    }
    console.log(loanDetails);
    const data = {
      user: user._id,
      amount: Amount,
      term: Term,
      interest,
      interestRate: interestRate,
      totalAmount: parseFloat((emi * Term).toFixed(2)),
      repaymentAmount: emi,
      remark,
      loanDetails,
      BankAccountDetails,
      modeOfPayment: "Bank Transfer",
    };

    // console.log(data);

    const newLoan = new loanModel(data);
    await newLoan.save();

    user.loan.push(newLoan._id);
    await user.save();

    return res.status(200).json({
      loan: newLoan,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.totalRemainingBalance = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await loanModel.findById(id);

    if (!loan) {
      return res.status(200).json({ message: "no laon found" });
    }

    var totalRemainingBalance  = 0;

    totalRemainingBalance =  loan.upcommingEMI?.remainingBalance + loan.upcommingEMI?.totalPayment;

    if(loan.dueEMI){
      loan?.dueEMI.map((item)=>{
        totalRemainingBalance += item?.totalPayment
      })
    }

    return res
      .status(200)
      .json({ message: "total Remaining", totalRemainingBalance });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.totalRemainingPay = async (req, res) => {
  try {
    const { id, transactionId, modeofpayment, amount } = req.body;
    const userId = req.userId;

    const Amount = parseInt(amount);

    const loan = await loanModel.findById(id);
    const user = await userModel.findById(userId);

    if (!loan) {
      return res.status(200).json({ message: "no laon found" });
    }

    const totalRemainingBalance =
      loan.upcommingEMI?.remainingBalance + loan.upcommingEMI?.totalPayment;

    if (totalRemainingBalance !== Amount) {
      return res.status(200).json({ message: "Invalid Amount" });
    }

    const transactiondta = {
      userId: user._id,
      amount: Amount,
      transactionType: "LoanRepayment",
      transactionId: transactionId
        ? transactionId
        : Math.floor(100000000 + Math.random() * 900000000),
      modeofpayment: modeofpayment ? modeofpayment : "Bank Transfer",
    };

    const newtransaction = new transactionModel(transactiondta);

    await newtransaction.save();

    // const currentMonth = new Date().getMonth() + 1;
    // const currentYear = new Date().getFullYear();

    // const balanceTrack = await balanceTrackModel.findOne({
    //   month: currentMonth,
    //   year: currentYear,
    // });

    // // if not found create a new one

    // if (!balanceTrack) {
    //   const previousBalanceTrack = await balanceTrackModel.find();
    //   var lastBalanceTrack;
    //   if (previousBalanceTrack.length > 0) {
    //     lastBalanceTrack =
    //       previousBalanceTrack[previousBalanceTrack.length - 1];
    //   }
    //   const newBalanceTrack = await balanceTrackModel.create({
    //     month: currentMonth,
    //     year: currentYear,
    //     // balance: admin?.balance,
    //     totalInterestEarned: 0,
    //     totalActiveLoan: !lastBalanceTrack
    //       ? 0
    //       : lastBalanceTrack.totalActiveLoan,
    //     totalInvestment: !lastBalanceTrack
    //       ? 0
    //       : lastBalanceTrack.totalInvestment,
    //     totalLoanRepayment: 0,
    //   });
    //   balanceTrack = newBalanceTrack;
    // }

    // // update the balance track
    // balanceTrack.totalLoanRepayment += Amount;
    // balanceTrack.totalInterestEarned += loan.upcommingEMI.interestPayment;

    // await balanceTrack.save();

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const balanceTrack = await balanceTrackModel.findOne({
      month: currentMonth,
      year: currentYear,
    });

    // if not found create a new one

    if (!balanceTrack) {
      const activeLoan = await loanModel.find({
        status: { $in: ["Default", "Active"] },
      });

      var activeLoanAmount = 0;

      activeLoan.map((loan) => {
        activeLoanAmount += loan.totalAmount;
      });

      var activeInvestmentAmount = 0;

      const activeInvestment = await investmentModel.find({ status: "Active" });

      activeInvestment.map((investment) => {
        activeInvestmentAmount += investment.amount;
      });

      const newBalanceTrack = await balanceTrackModel.create({
        month: currentMonth,
        year: currentYear,
        totalInterestEarned: loan.upcommingEMI.interestPayment,
        totalActiveLoan: activeLoanAmount,
        totalInvestment: activeInvestmentAmount,
        totalLoanRepayment: Amount,
      });
    } else {
      balanceTrack.totalLoanRepayment += Amount;
      balanceTrack.totalInterestEarned += loan.upcommingEMI.interestPayment;
      await balanceTrack.save();
    }

    user.transactions.push(newtransaction._id);

    loan.repaymenttransactionId.push(newtransaction._id);

    loan.upcommingEMI = null;
    loan.dueEMI = [];

    // loan.totalAmount = 
    loan.remark = `loan paid earlier, ${loan.remark}`

    loan.status = "Paid";

    const admin = await adminModel.findOne({ role: "Admin" });

    if (!admin) return res.status(404).json({ error: "Admin not found" });

    admin.balance += Amount;

    await admin.save();

    await loan.save();

    const notificationdta = {
      userId: user.id,
      title: "Successfull EMI",
      message: `${Amount} successfull EMI paid`,
    };

    const newNotification = await notificationModel.create(notificationdta);

    user.notification.push(newNotification.id);
    await user.save();

    return res.status(200).json({ message: "Paid success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

async function setDueEMI(loan) {
  try {
    return loan;

    // const currentEmi = loan.upcommingEMI.month;
    // const dueEMI = loan.loanDetails.slice(currentEmi, loan.term);
    // loan.dueEMI = dueEMI;
    // await loan.save();
  } catch (error) {
    console.log(error);
  }
}

routes.getLoans = async (req, res) => {
  try {
    const id = req.userId;
    // const id = req.params.id;
    console.log(id);
    const user = await UserModel.findById(id).populate({
      path: "loan",
      select:
        "amount interestRate interest totalAmount repaymentAmount remark status CreatedAt loanDetails upcommingEMI dueEMI",
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const Loan = await loanModel.find({ user: id });

    Loan?.map(async (loan) => {
      if (
        loan.status === "Paid" ||
        loan.status === "Closed" ||
        loan.status === "Pending" ||
        loan.status === "PendingByAdmin" ||
        loan.status === "Declined"
      )
        return;

      console.log(loan.upcommingEMI.date, "date");
      if (loan?.upcommingEMI.date > Date.now()) {
        console.log("date is greater");
        return;
      }

      loan.dueEMI.push(loan.upcommingEMI);

      if (loan.dueEMI.length > 0) {
        loan.status = "Default";
      }

      loan.upcommingEMI = loan.loanDetails[loan.upcommingEMI.month];

      await loan.save();
    });

    const activeLoan = user.loan.filter(
      (item) => item.status === "Active" || item.status === "Default"
    );

    const paidLoan = user.loan.filter(
      (item) => item.status === "Paid" || item.status === "Closed"
    );

    const approvalPending = user.loan.filter(
      (item) => item.status === "Pending" || item.status === "PendingByAdmin"
    );

    return res.status(200).json({ activeLoan, paidLoan, approvalPending });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.getLoanById = async (req, res) => {
  const { id } = req.params;

  try {
    const loan = await loanModel
      .findById(id)
      .populate("repaymenttransactionId giventransactionId");
    if (!loan) return res.status(404).json({ error: "Loan not found" });

    const paidAmount = loan.repaymenttransactionId
      .map((item) => item.amount)
      .reduce((a, b) => a + b, 0);

    return res.status(200).json({ loan, paidAmount });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.getLoanTransactions = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.query.userId;

    const loan = await loanModel
      .findById(id)
      .populate("repaymenttransactionId giventransactionId");

    if (!loan) return res.status(404).json({ error: "Loan not found" });

    // if(loan.user != userId) return res.status(404).json({ error: "Loan not found" });

    return res.status(200).json({
      given: loan.giventransactionId,
      repayment: loan.repaymenttransactionId,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.payEMI = async (req, res) => {
  try {
    // const _id = req.params.id;
    const _id = req.userId;
    const { amount, transactionId, modeofpayment, loanId } = req.body;

    const Amount = parseInt(amount);

    const user = await UserModel.findById(_id).populate("loan");
    if (!user) return res.status(404).json({ error: "User not found" });

    const loan = await loanModel.findOne({
      _id: loanId,
      status: "Active" || "Default",
    });

    if (!loan) return res.status(404).json({ error: "Loan not found" });

    const currentEmi = loan.upcommingEMI.month;

    // if(currentEmi > loan.term) return res.status(404).json({ error: "Loan is already paid" });

    if (
      Amount > loan.upcommingEMI.totalPayment ||
      Amount < loan.upcommingEMI.totalPayment
    )
      return res
        .status(404)
        .json({ error: "amount is not equal to current EMI" });

    const transactiondta = {
      userId: user._id,
      amount: Amount,
      transactionType: "LoanRepayment",
      transactionId: transactionId
        ? transactionId
        : Math.floor(100000000 + Math.random() * 900000000),
      modeofpayment: modeofpayment ? modeofpayment : "Bank Transfer",
    };

    const newtransaction = new transactionModel(transactiondta);

    await newtransaction.save();

    user.transactions.push(newtransaction._id);

    //   const newBalanceTrack = await balanceTrackModel.create({
    //     month: currentMonth,
    //     year: currentYear,
    //     // balance: admin?.balance,
    //     totalInterestEarned: 0,
    //     totalActiveLoan: !lastBalanceTrack
    //       ? 0
    //       : lastBalanceTrack.totalActiveLoan,
    //     totalInvestment: !lastBalanceTrack
    //       ? 0
    //       : lastBalanceTrack.totalInvestment,
    //     totalLoanRepayment: 0,
    //   });
    //   balanceTrack = newBalanceTrack;
    // }

    // // update the balance track
    // balanceTrack.totalLoanRepayment += Amount;
    // balanceTrack.totalInterestEarned += loan.upcommingEMI.interestPayment;

    // await balanceTrack.save();

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const balanceTrack = await balanceTrackModel.findOne({
      month: currentMonth,
      year: currentYear,
    });

    // if not found create a new one

    if (!balanceTrack) {
      const activeLoan = await loanModel.find({
        status: { $in: ["Default", "Active"] },
      });

      var activeLoanAmount = 0;

      activeLoan.map((loan) => {
        activeLoanAmount += loan.totalAmount;
      });

      var activeInvestmentAmount = 0;

      const activeInvestment = await investmentModel.find({ status: "Active" });

      activeInvestment.map((investment) => {
        activeInvestmentAmount += investment.amount;
      });

      const newBalanceTrack = await balanceTrackModel.create({
        month: currentMonth,
        year: currentYear,
        totalInterestEarned: loan.upcommingEMI.interestPayment,
        totalActiveLoan: activeLoanAmount,
        totalInvestment: activeInvestmentAmount,
        totalLoanRepayment: Amount,
      });
    } else {
      balanceTrack.totalLoanRepayment += Amount;
      balanceTrack.totalInterestEarned += loan.upcommingEMI.interestPayment;

      await balanceTrack.save();
    }

    const admin = await adminModel.findOne({ role: "Admin" });

    if (!admin) return res.status(404).json({ error: "Admin not found" });

    admin.balance += Amount;

    await admin.save();

    const notificationdta = {
      userId: user.id,
      title: "Successfull EMI",
      message: `${Amount} successfull EMI paid`,
    };

    const newNotification = await notificationModel.create(notificationdta);

    user.notification.push(newNotification.id);

    // currentEmi === loan.term ? loan.status = "Paid" : loan.status = loan.status;

    if (currentEmi === loan.term) {
      loan.status = "Paid";
      loan.upcommingEMI = null;
    } else {
      loan.upcommingEMI = loan.loanDetails[currentEmi];
    }

    loan.repaymenttransactionId.push(newtransaction._id);

    await loan.save();

    await user.save();

    return res.status(200).json({
      currentBalance: user.balance,
      transaction: newtransaction,
      loan: loan,
    });
  } catch (error) {
    console.log(error);
    console.log(req.body);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.payDueEMI = async (req, res) => {
  try {
    const _id = req.userId;
    const { amount, transactionId, modeofpayment, loanId } = req.body;

    console.log(req.body);

    const Amount = parseInt(amount);

    const user = await UserModel.findById(_id).populate("loan");
    if (!user) return res.status(404).json({ error: "User not found" });

    const loan = await loanModel.findOne({
      _id: loanId,
      // status: "Active" || "Default",
    });
    // console.log(loan);

    if (!loan) return res.status(404).json({ error: "Loan not found" });

    const currentEmi = loan.upcommingEMI.month;

    // if(currentEmi > loan.term) return res.status(404).json({ error: "Loan is already paid" });

    if (Amount !== loan.dueEMI[0].totalPayment)
      return res
        .status(404)
        .json({ error: "amount is not equal to current EMI" });

    const transactiondta = {
      userId: user._id,
      amount: Amount,
      transactionType: "LoanRepayment",
      transactionId: transactionId
        ? transactionId
        : Math.floor(100000000 + Math.random() * 900000000),
      modeofpayment: modeofpayment ? modeofpayment : "Bank Transfer",
    };

    const newtransaction = new transactionModel(transactiondta);

    await newtransaction.save();

    user.transactions.push(newtransaction._id);
    loan.repaymenttransactionId.push(newtransaction._id);

    // find the balance track of current month
    // const currentMonth = new Date().getMonth() + 1;
    // const currentYear = new Date().getFullYear();

    // const balanceTrack = await balanceTrackModel.findOne({
    //   month: currentMonth,
    //   year: currentYear,
    // });

    // // if not found create a new one

    // if (!balanceTrack) {
    //   const previousBalanceTrack = await balanceTrackModel.find();
    //   var lastBalanceTrack;
    //   if (previousBalanceTrack.length > 0) {
    //     lastBalanceTrack =
    //       previousBalanceTrack[previousBalanceTrack.length - 1];
    //   }
    //   const newBalanceTrack = await balanceTrackModel.create({
    //     month: currentMonth,
    //     year: currentYear,
    //     // balance: admin?.balance,
    //     totalInterestEarned: 0,
    //     totalActiveLoan: !lastBalanceTrack
    //       ? 0
    //       : lastBalanceTrack.totalActiveLoan,
    //     totalInvestment: !lastBalanceTrack
    //       ? 0
    //       : lastBalanceTrack.totalInvestment,
    //     totalLoanRepayment: 0,
    //   });
    //   balanceTrack = newBalanceTrack;
    // }

    // balanceTrack.totalLoanRepayment += Amount;
    // balanceTrack.totalInterestEarned += loan.dueEMI[0].interestPayment;

    // await balanceTrack.save();

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const balanceTrack = await balanceTrackModel.findOne({
      month: currentMonth,
      year: currentYear,
    });

    // if not found create a new one

    if (!balanceTrack) {
      const activeLoan = await loanModel.find({
        status: { $in: ["Default", "Active"] },
      });

      var activeLoanAmount = 0;

      activeLoan.map((loan) => {
        activeLoanAmount += loan.totalAmount;
      });

      var activeInvestmentAmount = 0;

      const activeInvestment = await investmentModel.find({ status: "Active" });

      activeInvestment.map((investment) => {
        activeInvestmentAmount += investment.amount;
      });

      const newBalanceTrack = await balanceTrackModel.create({
        month: currentMonth,
        year: currentYear,
        totalInterestEarned: loan.dueEMI[0].interestPayment,
        totalActiveLoan: activeLoanAmount,
        totalInvestment: activeInvestmentAmount,
        totalLoanRepayment: Amount,
      });
    } else {
      balanceTrack.totalLoanRepayment += Amount;
      balanceTrack.totalInterestEarned += loan.dueEMI[0].interestPayment;

      await balanceTrack.save();
    }

    const admin = await adminModel.findOne({ role: "Admin" });

    if (!admin) return res.status(404).json({ error: "Admin not found" });

    admin.balance += Amount;

    loan.dueEMI.shift();
    await loan.save();

    await admin.save();

    const notificationdta = {
      userId: user.id,
      title: "Successfull Due EMI",
      message: `${Amount} successfull Due EMI paid`,
    };

    const newNotification = await notificationModel.create(notificationdta);

    user.notification.push(newNotification.id);

    await user.save();

    return res.status(200).json({
      message: "success",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};
// export default routes;
module.exports = routes;
