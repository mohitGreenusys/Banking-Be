// import bcrpyt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import AdminModel from "../models/admin.model.js";
// import LoanModel from "../models/loan.model.js";
// import UserModel from "../models/user.model.js";
// import TransactionModel from "../models/transaction.model.js";
// import InvestmentModel from "../models/investment.model.js";
// import NotificationModel from "../models/notification.model.js";
// import sendOTP from "../utils/sendOTP.utils.js";
// import sendPassword from "../utils/sendPassword.utils.js";
// import CustomerSupportModel from "../models/CustomerSupport.model.js";
// import balanceTrackModel from "../models/balanceTrack.model.js";
// import withdrawlRequestsModel from "../models/withdrawlRequests.model.js";

const bcrpyt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AdminModel = require("../models/admin.model.js");
const LoanModel = require("../models/loan.model.js");
const UserModel = require("../models/user.model.js");
const TransactionModel = require("../models/transaction.model.js");
const InvestmentModel = require("../models/investment.model.js");
const NotificationModel = require("../models/notification.model.js");
const sendOTP = require("../utils/sendOTP.utils.js");
const sendPassword = require("../utils/sendPassword.utils.js");
const CustomerSupportModel = require("../models/CustomerSupport.model.js");
const balanceTrackModel = require("../models/balanceTrack.model.js");
const withdrawlRequestsModel = require("../models/withdrawlRequests.model.js");

const routes = {};

routes.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await AdminModel.findOne({ email }).select(
      "email password name balance role"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrpyt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    console.log(user.role);
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
    res.status(200).json({ result: user, token });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: "Please fill all the fields" });

  try {
    const olduser = await AdminModel.findOne({ email });
    if (olduser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrpyt.hash(password, 12);
    const result = await AdminModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: result._id, role: result.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
    res.status(201).json({ result, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// ----------------------------------------------Dashboard Details------------------------------------------------ //

routes.getdashboard = async (req, res) => {
  try {
    const totalmember = await UserModel.countDocuments();
    const allloan = await LoanModel.find();
    let totalloan = 0;
    let totalinterest = 0;
    allloan.forEach((loan) => {
      totalloan += loan.amount;
      let interest = 0,
        rate = loan.interestRate,
        term = loan.term,
        principal = loan.amount;
      if (loan.interest === "Compound Interest") {
        interest = principal * (Math.pow(1 + rate / 100, term) - 1);
      } else {
        interest = (principal * rate * term) / 100;
      }

      totalinterest += interest;
    });
    const allinvestment = await InvestmentModel.find();
    let totalyield = 0;
    allinvestment.forEach((investment) => {
      totalyield += investment.amount;
    });

    res.status(200).json({ totalmember, totalloan, totalinterest, totalyield });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.userbasedongender = async (req, res) => {
  try {
    const result = await UserModel.aggregate([
      {
        $group: {
          _id: "$gender",
          count: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.userbasedonjoining = async (req, res) => {
  try {
    // count user joined before a date
    const resuser = await UserModel.find().sort({ joiningDate: 1 });

    const result = [];
    let count = 0;
    let i = 0;
    let date = new Date(resuser[i].joiningDate.split("T")[0]);
    count++;
    result.push({ date, count });

    for (let i = 1; i < resuser.length; i++) {
      date = new Date(resuser[i].joiningDate.split("T")[0]);
      if (date === result[result.length - 1].date) {
        result[result.length - 1].count++;
      } else {
        result.push({ date, count });
      }
    }

    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.notify = async (req, res) => {
  try {
    const notifications = await NotificationModel.find()
      .sort({ createdAt: -1 })
      .limit(10);
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

// ----------------------------------------------User Details------------------------------------------------ //

routes.getalluser = async (req, res) => {
  try {
    const users = await UserModel.find().select(
      "-password -otp -otpExpires -loan -transactions -investment"
    );
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.getuser = async (req, res) => {
  const { id } = req.params;
  try {
    const myuser = await UserModel.findById(id)
      .populate("transactions")
      .populate("investment")
      .select("-password");

    // Initialize total deposit and balance
    let totaldeposit = 0;
    let balance = 0;

    const transactions = myuser.transactions.map((transaction) => {
      if (
        transaction.transactionType === "Investment" ||
        transaction.transactionType === "Deposit" ||
        transaction.transactionType === "LoanGiven"
      ) {
        if (transaction.transactionType !== "LoanGiven") {
          totaldeposit += transaction.amount;
        }
        balance += transaction.amount;
      } else {
        balance -= transaction.amount;
      }
      return { ...transaction._doc, balance };
    });

    transactions.reverse();

    myuser.transactions = transactions;

    res.status(200).json({ myuser, totaldeposit, balance });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.createuser = async (req, res) => {
  const { name, email, mobile, gender, dob } = req.body;
  try {
    console.log("createuser");
    const ifUser = await UserModel.findOne({ email });
    if (ifUser && ifUser.isVerified)
      return res.status(400).json({ error: "User already exists" });

    // unique number
    const uniqueNumberid = await UserModel.find({ mobile: mobile });
    if (uniqueNumberid.length > 0)
      return res.status(400).json({ error: "Mobile number already exists" });

    if (ifUser && !ifUser.isVerified) UserModel.findByIdAndDelete(ifUser._id);

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = Date.now() + 10 * 60 * 1000;

    const otpresult = await sendOTP(email, otp, "Verify your email");

    if (!otpresult.messageId)
      return res.status(500).json({ error: "Something went wrong with OTP" });

    const result = await UserModel.create({
      name,
      email,
      mobile,
      gender,
      dob,
      otp,
      otpExpires,
    });

    res
      .status(201)
      .json({ result, success: "OTP has been sent to your email" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.sendpasslink = async (req, res) => {
  const { id } = req.params;
  const document = req.file ? req.file.path : null;

  try {
    // console.log(img);
    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.document = document;
    const result = await user.save();

    const link = `${process.env.Frontend_URL}/resetpassword/${result._id}`;
    const emailresult = await sendPassword(
      result.email,
      link,
      "Reset Password"
    );

    if (!emailresult.messageId)
      return res.status(500).json({ error: "Something went wrong with email" });

    // add notification
    const notification = await NotificationModel.create({
      title: "New User",
      message: `${result.name} has been added by admin`,
    });

    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.verifyuser = async (req, res) => {
  const { id } = req.params;
  const { otp } = req.body;

  try {
    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.otpExpires < Date.now())
      return res.status(400).json({ error: "OTP expired" });

    if (user.otp != otp) return res.status(400).json({ error: "Invalid OTP" });

    user.isVerified = true;
    const result = await user.save();

    res.status(200).json({ result, success: "Verified" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.setsavingpro = async (req, res) => {
  const { id } = req.params;
  const { savingprofit } = req.body;

  try {
    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.savingprofit = savingprofit;

    const result = await user.save();

    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

// ----------------------------------------------Loan Details------------------------------------------------ //

routes.getloanbyid = async (req, res) => {
  const { id } = req.params;

  try {
    const loan = await LoanModel.findById(id)
      .populate("giventransactionId")
      .populate("repaymenttransactionId")
      .populate("user");

    // Total Paid amount
    let totalpaid = 0;
    let remaining = 0;

    if (loan.giventransactionId) {
      loan.repaymenttransactionId.forEach((transaction) => {
        totalpaid += transaction.amount;
      });

      // remaining amount
      remaining = loan.totalAmount - totalpaid;
    }

    res.status(200).json({ loan, totalpaid, remaining });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.getpendingloan = async (req, res) => {
  try {
    const role = req.role;

    if (role === "Admin") {
      const loans = await LoanModel.find({ status: "PendingByAdmin" }).populate(
        "user"
      );

      return res.status(200).json({ loans });
    }
    const loans = await LoanModel.find({ status: "Pending" }).populate("user");
    res.status(200).json({ loans });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.getapprovedloan = async (req, res) => {
  try {
    const loans = await LoanModel.find({ status: "Approved" }).populate("user");
    res.status(200).json({ loans });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.getrejectedloan = async (req, res) => {
  try {
    const loans = await LoanModel.find().populate("user");
    res.status(200).json({ loans });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.loanlistbyuser = async (req, res) => {
  const { id } = req.params;

  try {
    // also check for loan And status
    const loans = await UserModel.findById(id).populate({
      path: "loan",
      populate: {
        path: "giventransactionId",
        model: "Transaction",
        strictPopulate: false,
      },
    });
    res.status(200).json({ loans });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.loanmemberlist = async (req, res) => {
  try {
    const list = await UserModel.find({ isVerified: true }).select("name dob");
    res.status(200).json({ list });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.createLoanReducingInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, term, remark } = req.body;
    console.log(amount, term, remark, id);
    const admin = await AdminModel.findOne({ role: "Admin" });

    if (!admin) return res.status(404).json({ error: "Admin not found" });

    const interestRate = admin.interestRateReducing;

    const interest = "Reducing Interest";

    const user = await UserModel.findById(id);
    console.log(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const Amount = parseInt(amount);
    const Term = parseInt(term);
    const InterestRate = parseFloat(interestRate);

    // Calculate the monthly payment
    // const monthlyInterestRate = InterestRate / 100 / 12;
    const monthlyInterestRate = interestRate / 100 ;

    const monthlyPayment = Math.round( Amount * (monthlyInterestRate / (1 - Math.pow(1 + monthlyInterestRate, -Term))));

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
      interestRate: InterestRate,
      totalAmount: monthlyPayment * Term,
      repaymentAmount: monthlyPayment,
      remark,
      loanDetails,
    };

    const newLoan = new LoanModel(data);

    await newLoan.save();

    // const currentMonth = new Date().getMonth() + 1;
    // const currentYear = new Date().getFullYear();

    // const balanceTrack = await balanceTrackModel.findOne({
    //   month: currentMonth,
    //   year: currentYear,
    // });

    // // if not found create a new one

    // if (!balanceTrack) {
    //   const activeLoan = await LoanModel.find({
    //     status: { $in: ["Default", "Active"] },
    //   });

    //   var activeLoanAmount = 0;

    //   activeLoan.map((loan) => {
    //     activeLoanAmount += loan.totalAmount;
    //   });

    //   var activeInvestmentAmount = 0;

    //   const activeInvestment = await InvestmentModel.find({ status: "Active" });

    //   activeInvestment.map((investment) => {
    //     activeInvestmentAmount += investment.amount;
    //   });

    //   const newBalanceTrack = await balanceTrackModel.create({
    //     month: currentMonth,
    //     year: currentYear,
    //     totalInterestEarned: 0,
    //     totalActiveLoan: activeLoanAmount + Amount,
    //     totalInvestment: activeInvestmentAmount,
    //     totalLoanRepayment: 0,
    //   });
    // }
    // else{
    //   balanceTrack.totalActiveLoan += (monthlyPayment * Term),
    //   await balanceTrack.save();
    // }

    user.loan.push(newLoan._id);
    const result = await user.save();

    return res.status(200).json({ loan: newLoan, result: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.createLoanSimpleInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, term, remark } = req.body;

    const interest = "Simple Interest";

    const admin = await AdminModel.findOne({ role: "Admin" });

    if (!admin) return res.status(404).json({ error: "Admin not found" });

    const interestRate = admin.interestRateSimple;

    const user = await UserModel.findById(id);

    if (!user) return res.status(404).json({ error: "User not found" });

    const Amount = parseInt(amount);
    const Term = parseInt(term);
    const InterestRate = parseFloat(interestRate);

    // const totalAmount = Amount + (Amount * InterestRate) / 100;
    const totalAmount = Amount + (Amount * interestRate/100 * Term   );

    const repaymentAmount = Math.round(totalAmount / Term);
    let balance = Amount;

    const loanDetails = [];

    // Calculate the loan details for each month
    for (let month = 1; month <= Term; month++) {
      const interestPayment = balance * (InterestRate / 100 / 12 ); // Monthly interest payment
      const principalPayment = repaymentAmount - interestPayment;
      balance -= principalPayment;

      const installment = {
        month,
        principalPayment,
        interestPayment,
        totalPayment: repaymentAmount,
        remainingBalance: balance,
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
    };

    const newloan = new LoanModel(data);

    await newloan.save();

    // const currentMonth = new Date().getMonth() + 1;
    // const currentYear = new Date().getFullYear();

    // const balanceTrack = await balanceTrackModel.findOne({
    //   month: currentMonth,
    //   year: currentYear,
    // });

    // // if not found create a new one

    // if (!balanceTrack){
    //   const activeLoan = await LoanModel.find({
    //     status: { $in: ["Default", "Active"] },
    //   });

    //   var activeLoanAmount = 0;

    //   activeLoan.map((loan) => {
    //     activeLoanAmount += loan.totalAmount;
    //   });

    //   var activeInvestmentAmount = 0;

    //   const activeInvestment = await InvestmentModel.find({ status: "Active" });

    //   activeInvestment.map((investment) => {
    //     activeInvestmentAmount += investment.amount;
    //   });

    //   const newBalanceTrack = await balanceTrackModel.create({
    //     month: currentMonth,
    //     year: currentYear,
    //     totalInterestEarned: 0,
    //     totalActiveLoan: activeLoanAmount + Amount,
    //     totalInvestment: activeInvestmentAmount,
    //     totalLoanRepayment: 0,
    //   });
    // }else{
    //   balanceTrack.totalActiveLoan +=  totalAmount,
    //   await balanceTrack.save();
    // }

    user.loan.push(newloan._id);
    const result = await user.save();

    return res.status(200).json({ loan: newloan, result: result });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.createLoanCompoundInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, term, remark } = req.body;

    const user = await UserModel.findById(id);
    // console.log(user);

    if (!user) return res.status(404).json({ error: "User not found" });

    // user?.loan?.map((loan) => {
    //   if (loan.status === "Default" || loan.status === "Active") {
    //     return res.status(404).json({ error: "User already have loan" });
    //   }
    // });

    const admin = await AdminModel.findOne({ role: "Admin" });

    const interestRate = admin.interestRateCompound;

    // const interestRate = 10;

    const Amount = parseInt(amount);
    const Term = parseInt(term); 
    const InterestRate = parseFloat(interestRate);

 

    const principal = Amount; // Loan amount
    const rate = InterestRate / 100; // yearly interest rate
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
      interest:"Compound Interest",
      interestRate: interestRate,
      totalAmount: parseFloat((emi * Term).toFixed(2)),
      repaymentAmount: emi,
      remark,
      loanDetails,
      // BankAccountDetails,
      modeOfPayment: "Cash",
    };

    console.log(data);

    const newLoan = new LoanModel(data);
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

// routes.createloan = async (req, res) => {
//   const { userid } = req.params;
//   const { amount, term, interest, repaymentterm } = req.body;

//   try {
//     const user = await UserModel.findOne({ _id: userid });
//     if (!user) return res.status(404).json({ error: "User not found" });

//     const loan = await LoanModel.create({
//       user: userid,
//       amount,
//       term,
//       interest,
//       repaymentterm,
//       status: "Pending",
//     });

//     let loanlist = user.loan;
//     loanlist.push(loan._id);

//     user.loan = loanlist;
//     const result = await user.save();

//     // add notification
//     const notification = await NotificationModel.create({
//       title: "New Loan",
//       message: `${user.name} has applied for loan`,
//     });

//     res.status(201).json({ loan });
//   } catch (error) {
//     res.status(500).json({ error: "Something went wrong" });
//   }
// };

routes.addpaymentmethod = async (req, res) => {
  const { id } = req.params;
  const { paymentmethod } = req.body;

  try {
    const loan = await LoanModel.findById(id);
    if (!loan) return res.status(404).json({ error: "Loan not found" });

    loan.paymentmethod = paymentmethod;
    const result = await loan.save();

    // add notification
    const notification = await NotificationModel.create({
      userId: loan.user,
      title: "Payment Method Added",
      message: `${result._id}'s payment method has been added`,
    });

    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

// routes.approveloan = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const loan = await LoanModel.findById(id);
//     if (!loan) return res.status(404).json({ error: "Loan not found" });

//     loan.status = "Approved";

//     // add given transaction
//     const transaction = await TransactionModel.create({
//       userId: loan.user,
//       amount: loan.amount,
//       transactionType: "LoanGiven",
//       transactionId: Math.floor(100000000 + Math.random() * 900000000),
//     });

//     loan.giventransactionId = transaction._id;
//     const result = await loan.save();

//     // add notification
//     const notification = await NotificationModel.create({
//       title: "Loan Approved",
//       message: `${result._id}'s loan has been approved`,
//     });

//   // i want to add dates in the all objects of loanDetails. date of first month will be the one month after the current date. and the date of second month will be the two month after the current date and so on.

//     res.status(200).json({ result });
//   } catch (error) {
//     res.status(500).json({ error: "Something went wrong" });
//   }
// };

routes.approveLoanByManager = async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.role;

    if (role !== "Manager")
      return res.status(401).json({ error: "Unauthorized" });

    const loan = await LoanModel.findOne({ _id: id, status: "Pending" });
    // const loan = await LoanModel.findById(id,{status:"Pending"});

    if (!loan) return res.status(404).json({ error: "Loan not found" });

    loan.status = "PendingByAdmin";

    const result = await loan.save();

    return res
      .status(200)
      .json({ result, success: "Loan Approved By Manager" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

routes.approveloan = async (req, res) => {
  const { id } = req.params;

  try {
    const role = req.role;
    const loan = await LoanModel.findOne({ _id: id, status: "PendingByAdmin" });
    if (!loan) return res.status(404).json({ error: "Loan not found" });

    if (role !== "Admin") {
      return res.status(401).json({ error: "you are not a Admin" });
    }

    const admin = await AdminModel.findOne({ role: "Admin" });

    if (!admin) return res.status(404).json({ error: "Admin not found" });

    loan.status = "Active";

    // Add given transaction
    const transaction = await TransactionModel.create({
      userId: loan.user,
      amount: loan.amount,
      transactionType: "LoanGiven",
      transactionId: Math.floor(100000000 + Math.random() * 900000000),
    });

    loan.giventransactionId = transaction._id;

    // Calculate the repayment dates
    const repaymentDates = [];

    const currentDate = new Date(); // Get the current date
    for (let month = 1; month <= loan.term; month++) {
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(currentDate.getMonth() + month);
      repaymentDates.push(nextMonth);
    }

    // Update loanDetails with repayment dates
    const loanDetails = loan.loanDetails.map((installment, index) => {
      installment.date = repaymentDates[index];
      return installment;
    });

    loan.loanDetails = null;
    loan.loanDetails = loanDetails;

    loan.upcommingEMI = loan.loanDetails[0];

    // Save the updated loan model
    const updatedLoan = await loan.save();

    admin.balance -= loan.amount;
    await admin.save();


    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const balanceTrack = await balanceTrackModel.findOne({
      month: currentMonth,
      year: currentYear,
    });

    // if not found create a new one

    if (!balanceTrack) {
      const activeLoan = await LoanModel.find({
        status: { $in: ["Default", "Active"] },
      });

      var activeLoanAmount = 0;

      activeLoan.map((loan) => {
        activeLoanAmount += loan.totalAmount;
      });

      var activeInvestmentAmount = 0;

      const activeInvestment = await InvestmentModel.find({ status: "Active" });

      activeInvestment.map((investment) => {
        activeInvestmentAmount += investment.amount;
      });

      const newBalanceTrack = await balanceTrackModel.create({
        month: currentMonth,
        year: currentYear,
        totalInterestEarned: 0,
        totalActiveLoan: activeLoanAmount ,
        totalInvestment: activeInvestmentAmount,
        totalLoanRepayment: 0,
      });
    }
    else{
      balanceTrack.totalActiveLoan += loan.totalAmount,
      await balanceTrack.save();
    }

    // Add notification
    const notification = await NotificationModel.create({
      userId: loan.user,
      title: "Loan Approved",
      message: `${updatedLoan._id}'s loan has been approved`,
    });

    res.status(200).json({ result: updatedLoan });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.rejectloan = async (req, res) => {
  const { id } = req.params;

  try {
    const loan = await LoanModel.findById(id);
    if (!loan) return res.status(404).json({ error: "Loan not found" });
    loan.status = "Declined";
    const result = await loan.save();

    // add notification
    const notification = await NotificationModel.create({
      userId:loan.user,
      title: "Loan Rejected",
      message: `${result._id}'s loan has been rejected`,
    });

    res.status(200).json({ result });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Something went wrong" });
  }
};

// ----------------------------------------------Investment Details------------------------------------------------ //

routes.getinvestment = async (req, res) => {
  try {
    const investments = await UserModel.find().populate("investment");
    res.status(200).json({ investments });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.releaseInvestmentInterestFixedInterest = async (req, res) => {
  try {
    const admin = await AdminModel.findOne({ role: "Admin" });

    // Find all investments
    const investments = await InvestmentModel.find({
      status: "Active",
      savingProduct: "setInterest",
    });

    for (const investment of investments) {
      investment.interestEarned += Math.round(
        (investment.amount * admin.interestOnInvestment) / 100
      );

      admin.balance -= Math.round(
        (investment.amount * admin.interestOnInvestment) / 100
      );

      await investment.save();

      const notification = await NotificationModel.create({
        userId: investment.userId,
        title: "Interest Released",
        message: `Interest has been released for all investments`,
      });

      const user = await UserModel.findById(investment.userId);
      user.balance += (investment.amount * admin.interestOnInvestment) / 100;
      user.notification.push(notification._id);
      await user.save();
    }

    await admin.save();

    // Add notification

    // const notification = await NotificationModel.create({
    //   title: "Interest Released",
    //   message: `Interest has been released for all investments`,
    // });

    res.status(200).json({ success: "Interest Released" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Something went wrong", error: error.message });
  }
};

routes.releaseInvestmentInterestShareProfit = async (req, res) => {
  try {
    // find previous balanceTrack
    const previousBalanceTrack = await balanceTrackModel.find();
    var lastBalanceTrack;
    if (previousBalanceTrack.length > 0) {
      lastBalanceTrack = previousBalanceTrack[previousBalanceTrack.length - 1];
    }

    const admin = await AdminModel.findOne({ role: "Admin" });

    // find all investments
    const investments = await InvestmentModel.find({
      status: "Active",
      savingProduct: "shareProfit",
    });

    const totalActiveLoan = lastBalanceTrack?.totalActiveLoan;

    const totalInvestment = lastBalanceTrack?.totalInvestment;

    const totalInterestEarned = lastBalanceTrack?.totalInterestEarned;

    investments.forEach(async (investment) => {
      // console.log(investment);
      //calculate percentage of investment.amount in totalActiveLoan
      const percentage = investment.amount / totalInvestment;
      admin.balance -= Math.round(totalInterestEarned * percentage);
      investment.interestEarned += Math.round(totalInterestEarned * percentage);
      await investment.save();
      
      // const user = await UserModel.findById(investment.userId);
      // var newBalance = user.balance;
      // newBalance = newBalance + Math.round(totalInterestEarned * percentage);
      // user.balance = newBalance
      // console.log(newBalance)
      //
      // const User =  await user.save();
      // console.log(User)
    });

    const allUsers = await UserModel.find({ investment: { $exists: true, $ne: [] } }).populate("investment");

    allUsers.forEach(async(user)=>{
      var totalInvestment = 0;
      var totalInterest = 0;
      user.investment.map((investment)=>{
        if(investment.status === "Active" && investment.savingProduct === "shareProfit"){
          totalInterest += investment.interestEarned;
          totalInvestment += investment.amount;
        }
      })

      const notification = await NotificationModel.create({
        userId: user._id,
        title: `Interest Released for ${totalInvestment}`,
        message: `Interest has been released for ${totalInvestment}`,
      });

      var totalAmount = totalInterest + totalInvestment
      user.balance = totalAmount;
      user.notification.push(notification._id);
      await user.save()
    })


    await admin.save();

    // add notification

    res.status(200).json({ success: "Interest Released" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Something went wrong", error: error.message });
  }
};

routes.getinvestmentbyuser = async (req, res) => {
  const { id } = req.params;
  try {
    const investments = await UserModel.findById(id)
      .populate("investment")
      .populate("transactions");
    // total amount
    let totalamount = 0;

    investments.investment.forEach((investment) => {
      totalamount += investment.amount;
    });

    res.status(200).json({ investments, totalamount });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.withdrawInvestment = async (req, res) => {
  try {
    const withdrawlRequests = await withdrawlRequestsModel
      .find({
        status: "Pending",
      })
      .populate({
        path: "user",
        select: "name email",
      });

    return res.status(200).json({ withdrawlRequests });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Something went wrong", error: error.message });
  }
};

routes.approveWithdrawlRequest = async (req, res) => {
  try {
    const id = req.params.id;
    const role = req.role;

    if (role !== "Admin")
      return res.status(401).json({ error: "Unauthorized" });

    const withdrawlRequest = await withdrawlRequestsModel.findOne({
      _id: id,
      status: "Pending",
    });
    if (!withdrawlRequest)
      return res.status(404).json({ error: "withdrawlRequest not found" });

    withdrawlRequest.status = "Approved";

    const result = await withdrawlRequest.save();

    const admin = await AdminModel.findOne({ role: "Admin" });

    if (!admin) return res.status(404).json({ error: "Admin not found" });

    admin.balance -= withdrawlRequest.amount;

    await admin.save();

    const notification = await NotificationModel.create({
      userId: withdrawlRequest.user,
      title: `${withdrawlRequest.amount} Withdrawl Request Approved`,
      message: `Your withdrawl request has been approved`,
    });

    const user = await UserModel.findById(withdrawlRequest.user);
    const userInvestments = await InvestmentModel.find({
      userId: withdrawlRequest.user,
      status: "Active",
    });
    let totalInvestment = 0;
    userInvestments.forEach((investment) => {
      totalInvestment += investment.amount;
      totalInvestment += investment.interestEarned;
    });
    if (totalInvestment < withdrawlRequest.amount)
      return res.status(400).json({ error: "Insufficient Balance" });

    var remainingAmount = withdrawlRequest.amount;

    userInvestments.forEach(async (investment) => {
      if (remainingAmount > 0) {
        if (investment.amount + investment.interestEarned > remainingAmount) {
          if (investment.amount > remainingAmount) {
            investment.amount -= remainingAmount;
            remainingAmount = 0;
          } else {
            remainingAmount -= investment.amount;
            investment.amount = 0;
          }
        } else {
          remainingAmount -= investment.amount + investment.interestEarned;
          investment.amount = 0;
          investment.interestEarned = 0;
          investment.status = "Withdrawn";
        }

        await investment.save();
      }
    });

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const balanceTrack = await balanceTrackModel.findOne({
      month: currentMonth,
      year: currentYear,
    });

    // if not found create a new one

    if (balanceTrack) {
      balanceTrack.totalInvestment -= withdrawlRequest.amount,
      await balanceTrack.save();
    }

    user.balance -= withdrawlRequest.amount;

    user.notification.push(notification._id);

    const transaction = await TransactionModel.create({
      userId: user.id,
      amount: withdrawlRequest.amount,
      transactionId: Math.floor(100000000 + Math.random() * 900000000),
      transactionType: "Withdraw",
    });

    user.transactions.push(transaction._id);

    await user.save();

    return res.status(200).json({ result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.rejectWithdrawlRequest = async (req, res) => {
  try {
    const id = req.params.id;
    const role = req.role;

    if (role !== "Admin")
      return res.status(401).json({ error: "Unauthorized" });

    const withdrawlRequest = await withdrawlRequestsModel.findOne({
      _id: id,
      status: "Pending",
    });

    if (!withdrawlRequest)
      return res.status(404).json({ error: "withdrawlRequest not found" });

    withdrawlRequest.status = "Rejected";

    const result = await withdrawlRequest.save();

    const notification = await NotificationModel.create({
      userId: withdrawlRequest.user,
      title: `${withdrawlRequest.amount}Withdrawl Request Rejected`,
      message: `${withdrawlRequest.amount} Your withdrawl request has been rejected`,
    });

    const user = await UserModel.findById(withdrawlRequest.user);

    user.notification.push(notification._id);
    await user.save();

    return res.status(200).json({ result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.depositInvestment = async (req, res) => {
  try {
    const { id, amount, modeofpayment, transactionId } = req.body;
    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const dta = {
      userId: user._id,
      amount,
      transactionType: "Investment",
      savingProduct: user.savingProduct,
    };

    const newinvestment = new InvestmentModel(dta);
    await newinvestment.save();

    user.investment.push(newinvestment._id);

    const transactiondta = {
      userId: user._id,
      amount,
      transactionType: "Investment",
      transactionId: transactionId
        ? transactionId
        : Math.floor(100000000 + Math.random() * 900000000),
    };

    const newtransaction = new TransactionModel(transactiondta);

    await newtransaction.save();

    user.transactions.push(newtransaction._id);

    user.balance += amount;

    const admin = await adminModel.findOne({ role: "Admin" });

    if (!admin) return res.status(404).json({ error: "Admin not found" });

    admin.balance += amount;

    await admin.save();

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const balanceTrack = await balanceTrackModel.findOne({
      month: currentMonth,
      year: currentYear,
    });

    if (!balanceTrack) {
      const previousBalanceTrack = await balanceTrackModel.find();
      var lastBalanceTrack;
      if (previousBalanceTrack.length > 0) {
        lastBalanceTrack =
          previousBalanceTrack[previousBalanceTrack.length - 1];
      }
      const newBalanceTrack = await balanceTrackModel.create({
        month: currentMonth,
        year: currentYear,
        totalInterestEarned: 0,
        totalActiveLoan: lastBalanceTrack?.totalActiveLoan,
        totalInvestment: lastBalanceTrack?.totalInvestment + amount,
        totalLoanRepayment: 0,
      });

      balanceTrack = newBalanceTrack;
    }

    balanceTrack.totalInvestment += amount;

    await balanceTrack.save();

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
    return res.status(500).json({ error: "Something went wrong" });
  }
};

// ----------------------------------------------Transaction Details------------------------------------------------ //

routes.gettransaction = async (req, res) => {
  try {
    const { range } = req.params;
    const days = parseInt(range);

    let query = {};

    if (!isNaN(days) && days > 0) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      query = { date: { $gte: startDate } };
    }

    const transactions = await TransactionModel.find(query).populate("userId");

    // total profit
    let totalprofit = 0;

    // total deposit
    let totaldeposit = 0;
    transactions.forEach((transaction) => {
      if (transaction.transactionType === "Investment")
        totaldeposit += transaction.amount;
    });

    // total withdraw
    let totalwithdraw = 0;
    transactions.forEach((transaction) => {
      if (transaction.transactionType === "LoanGiven")
        totalwithdraw += transaction.amount;
    });

    return res
      .status(200)
      .json({ transactions, totalprofit, totaldeposit, totalwithdraw });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.userTranstionDetail = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await UserModel.findById(userId);

    var totaldeposit = 0;
    var totalwithdraw = 0;

    //   "Deposit",
    //   "Withdraw",
    //   "LoanGiven",// deposit(user)
    //   "LoanPaid", //withdraw(user)
    //   "Investment", // deposit(user)
    //   "LoanRepayment", // withdraw(user)

    const loanArray = ["LoanGiven", "LoanPaid", "LoanRepayment"];

    const InvestmentArray = ["Deposit", "Withdraw", "Investment"];

    const loanTransaction = await TransactionModel.find({
      userId,
      transactionType: { $in: loanArray },
    });

    const InvestTransaction = await TransactionModel.find({
      userId,
      transactionType: { $in: InvestmentArray },
    });

    InvestTransaction.map((item) => {
      if (item.transactionType === "Withdraw") {
        totalwithdraw += item.amount;
      } else {
        totaldeposit += item.amount;
      }
    });

    return res.status(200).json({
      totaldeposit,
      totalwithdraw,
      balance: user.balance,
      loanTransaction,
      InvestTransaction,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// ----------------------------------------------Customer Support------------------------------------------------ //

routes.getCustomerSupport = async (req, res) => {
  try {
    const customerSupport = await CustomerSupportModel.find().populate({
      path: "user",
      select: "name email",
      strictPopulate: false,
    });
    res.status(200).json({ customerSupport });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.getCustomerSupportById = async (req, res) => {
  const { id } = req.params;
  try {
    const customerSupport = await CustomerSupportModel.findById(id).populate({
      path: "user",
      select: "name email",
      strictPopulate: false,
    });
    res.status(200).json({ customerSupport });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

routes.getPendingCustomerSupport = async (req, res) => {
  try {
    const customerSupport = await CustomerSupportModel.find({
      status: "Pending",
    }).populate({
      path: "user",
      select: "name email",
      strictPopulate: false,
    });
    res.status(200).json({ customerSupport });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

// ----------------------------------------------Admin Details------------------------------------------------ //

routes.getadmintrans = async (req, res) => {
  try {
    const transactions = await TransactionModel.find()
      .populate({
        path: "userId",
        select: "name email",
      })
      .sort({ date: -1 })
      .limit(10);
    const admin = await AdminModel.findOne({ role: "Admin" });

    return res.status(200).json({ transactions, balance: admin.balance });

    // const transactions = await transactionmodel.find().populate("userId");
    // res.status(200).json({ transactions });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// export default routes;
module.exports = routes;
