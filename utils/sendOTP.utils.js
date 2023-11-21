// import nodemailer from "nodemailer";
const nodemailer = require("nodemailer");

const emailtemplateotp = (otp) => {
  return `
  <div style="background-color: #f2f2f2; padding: 20px 0;">
    <div style="background-color: #fff; width: 50%; margin: 0 auto; padding: 20px; border-radius: 10px;">
      <h1 style="text-align: center; color: #000;">Welcome to <span style="color: #ff0000;">${process.env.APP_NAME}</span></h1>
      <p style="text-align: center; color: #000;">Your OTP for registration is <span style="color: #ff0000;">${otp}</span> and it is valid for <span style="color: #ff0000;">10</span> minutes.</p>
    </div>
  </div>
  `;
};

const sendOTP = async (email, otp, title) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
        // refreshToken: process.env.REFRESH_TOKEN,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_EMAIL,
      to: email,
      subject: title,
      html: emailtemplateotp(otp),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(result);
    return result;
  } catch (error) {
    console.log(error);
  }
};

// export default sendOTP;
module.exports = sendOTP;
