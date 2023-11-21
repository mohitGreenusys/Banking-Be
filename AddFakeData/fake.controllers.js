// import loanmodel from "../models/loan.model.js";
// import usermodel from "../models/user.model.js";
// import transactionmodel from "../models/transaction.model.js";
// import investmentmodel from "../models/investment.model.js";
// import notificationmodel from "../models/notification.model.js";
// import customerSupportModel from "../models/CustomerSupport.model.js";
// import adminModel from "../models/admin.model.js";

const loanmodel = require("../models/loan.model.js");
const usermodel = require("../models/user.model.js");
const transactionmodel = require("../models/transaction.model.js");
const investmentmodel = require("../models/investment.model.js");
const notificationmodel = require("../models/notification.model.js");
const customerSupportModel = require("../models/CustomerSupport.model.js");
const adminModel = require("../models/admin.model.js");

// ----------------------------------------------Fake users------------------------------------------------ //

const routes = {};

routes.fakeusers = async (req, res) => {
  try {
    for (let i = 0; i < 10; i++) {
      const otp = Math.floor(100000 + Math.random() * 900000);
      const otpExpires = Date.now() + 10 * 60 * 1000;

      const dta = {
        name: "user " + i,
        email: `user${i}@testing.in`,
        mobile: "123456789" + i,
        gender: i % 2 ? "Male" : "Female",
        dob: "1999-01-01",
        otp: otp,
        otpExpires: otpExpires,
        isVerified: i % 2 ? false : true,
      };

      const newuser = new usermodel(dta);
      await newuser.save();
    }

    res.status(200).json({ message: "Fake users added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

routes.fakeloan = async (req, res) => {
  try {
    const users = await usermodel.find({ isVerified: true });

    for (let i = 0; i < 10; i++) {
      const randomuser = users[Math.floor(Math.random() * users.length)];

      const dta = {
        user: randomuser._id,
        amount: Math.floor(10000 + Math.random() * 90000),
        term: Math.floor(1 + Math.random() * 12),
        interest: i % 2 ? "Compound Interest" : "Simple Interest",
        interestRate: Math.floor(1 + Math.random() * 10),
        repaymentterm: Math.floor(1 + Math.random() * 12),
        modeOfPayment: i % 2 ? "Bank Transfer" : "Cash",
        status: i % 3 ? (i % 2 ? "Approved" : "Declined") : "Pending",
        remark: `Loan Narration ${i}`,
      };

      const newloan = new loanmodel(dta);
      await newloan.save();
      randomuser.loan.push(newloan._id);
      await randomuser.save();
    }

    res.status(200).json({ message: "Fake loan added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

routes.fakeinvestment = async (req, res) => {
  try {
    const users = await usermodel.find({ isVerified: true });

    for (let i = 0; i < 10; i++) {
      const randomuser = users[Math.floor(Math.random() * users.length)];

      const dta = {
        userId: randomuser._id,
        amount: Math.floor(10000 + Math.random() * 90000),
        transactionType: i % 2 ? "Deposit" : "Withdraw",
        savingProduct: i % 2 ? "Saving" : "Profit",
        remark: `Investment Narration ${i}`,
      };

      const newinvestment = new investmentmodel(dta);
      await newinvestment.save();

      randomuser.investment.push(newinvestment._id);
      await randomuser.save();
    }

    res.status(200).json({ message: "Fake investment added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

routes.fakenotification = async (req, res) => {
  try {
    for (let i = 0; i < 10; i++) {
      const dta = {
        title: "Notification " + i,
        message: "This is a fake notification " + i,
      };
      const newnotification = new notificationmodel(dta);
      await newnotification.save();
    }
    res.status(200).json({ message: "Fake notification added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

routes.faketransaction = async (req, res) => {
  try {
    // Clear all transactions
    const users = await usermodel.find({});
    for (let i = 0; i < users.length; i++) {
      users[i].transactions = [];
      await users[i].save();
    }

    // For loan transaction
    const loans = await loanmodel.find({ status: "Approved" });
    for (let i = 0; i < loans.length; i++) {
      const dta = {
        userId: loans[i].user,
        amount: loans[i].amount,
        transactionId: Math.floor(100000000 + Math.random() * 900000000),
        transactionType: "LoanGiven",
        remark: loans[i].remark,
      };
      const newtransaction = new transactionmodel(dta);
      await newtransaction.save();
      loans[i].giventransactionId = newtransaction._id;
      await loans[i].save();

      const user = await usermodel.findById(loans[i].user);
      user.transactions.push(newtransaction._id);
      await user.save();
    }

    for (let i = 0; i < loans.length; i++) {
      const dta = {
        userId: users[i].id,
        amount: loans[i].amount,
        transactionId: Math.floor(100000000 + Math.random() * 900000000),
        transactionType: "Deposit",
        remark: "upi",
      };
      const newtransaction = new transactionmodel(dta);
      await newtransaction.save();

      const user = await usermodel.findById(users[i].id);
      user.transactions.push(newtransaction._id);
      await user.save();
    }

    for (let i = 0; i < loans.length; i++) {
      const dta = {
        userId: users[i].id,
        amount: loans[i].amount,
        transactionId: Math.floor(100000000 + Math.random() * 900000000),
        transactionType: "Withdraw",
        remark: "upi",
      };
      const newtransaction = new transactionmodel(dta);
      await newtransaction.save();

      const user = await usermodel.findById(users[i].id);
      user.transactions.push(newtransaction._id);
      await user.save();
    }

    // For investment transaction
    const investments = await investmentmodel.find({});
    for (let i = 0; i < investments.length; i++) {
      const dta = {
        userId: investments[i].userId,
        amount: investments[i].amount,
        transactionId: Math.floor(100000000 + Math.random() * 900000000),
        transactionType: "Investment",
        remark: investments[i].remark,
      };
      const newtransaction = new transactionmodel(dta);
      await newtransaction.save();

      const user = await usermodel.findById(investments[i].userId);
      user.transactions.push(newtransaction._id);
      await user.save();
    }

    res.status(200).json({ message: "Fake transaction added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

routes.fakerepayment = async (req, res) => {
  try {
    const loans = await loanmodel.find({ status: "Approved" });
    for (let i = 0; i < loans.length; i++) {
      const dta = {
        userId: loans[i].user,
        amount: loans[i].amount,
        transactionId: Math.floor(100000000 + Math.random() * 900000000),
        transactionType: "LoanRepayment",
        remark: loans[i].remark,
      };
      const newtransaction = new transactionmodel(dta);
      await newtransaction.save();
      loans[i].repaymenttransactionId = newtransaction._id;
      await loans[i].save();

      const user = await usermodel.findById(loans[i].user);
      user.transactions.push(newtransaction._id);
      await user.save();
    }

    res.status(200).json({ message: "Fake repayment added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

routes.fakeadmintransaction = async (req, res) => {
  try {
    const admin = await adminModel.findById("650bf04008056e3dfbdf6a55");

    const alltransactions = await transactionmodel.find({});

    for (let i = 0; i < alltransactions.length; i++) {
      admin.transactions.push(alltransactions[i]._id);
      if (alltransactions[i].transactionType === "LoanGiven") {
        admin.balance -= alltransactions[i].amount;
      } else if (alltransactions[i].transactionType === "Investment") {
        admin.balance += alltransactions[i].amount;
      }
    }

    await admin.save();

    res.status(200).json({ message: "Admin transaction added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

routes.fakecustomersupport = async (req, res) => {
  try {
    const users = await usermodel.find({});
    for (let i = 0; i < users.length; i++) {
      const dta = {
        user: users[i]._id,
        subject: "Subject " + i,
        message: "This is a fake message " + i,
        status: i % 2 ? "Pending" : "Resolved",
      };
      const newcustomersupport = new customerSupportModel(dta);
      await newcustomersupport.save();
    }
    res
      .status(200)
      .json({ message: "Fake customer support added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

routes.deleteall = async (req, res) => {
  try {
    await usermodel.deleteMany({});
    await loanmodel.deleteMany({});
    await transactionmodel.deleteMany({});
    await investmentmodel.deleteMany({});
    await notificationmodel.deleteMany({});
    await customerSupportModel.deleteMany({});
    await adminModel.deleteMany({});

    res.status(200).json({ message: "All data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

routes.unapproveloan = async (req, res) => {
  try {
    const loans = await loanmodel.find({ status: "Approved" });
    // filter without given transaction id
    const filteredLoans = loans.filter(
      (loan) => loan.giventransactionId === undefined
    );
    for (let i = 0; i < filteredLoans.length; i++) {
      filteredLoans[i].status = "Pending";
      await filteredLoans[i].save();
    }

    res.status(200).json({ message: "All loan unapproved successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default routes;
