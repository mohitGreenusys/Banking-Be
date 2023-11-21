// import nodemailer from "nodemailer";
const nodemailer = require("nodemailer");

const emailtemplatepasswordlink = (link) => {
  return `
  <div style="background-color: #f2f2f2; padding: 20px 0;">
    <div style="background-color: #fff; width: 50%; margin: 0 auto; padding: 20px; border-radius: 10px;">
        <h1 style="text-align: center; color: #000;">Welcome to <span style="color: #ff0000;">${process.env.APP_NAME}</span></h1>
        <p style="text-align: center; color: #000;">Click on the link below to reset your password.</p>
        <a href="${link}" style="display: block; text-align: center; color: #fff; background-color: #ff0000; padding: 10px; border-radius: 5px; text-decoration: none;">Reset Password</a>
  </div>
  `;
};

const sendPasswordLink = async (email, otp, title) => {
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
      html: emailtemplatepasswordlink(otp),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(result);
    return result;
  } catch (error) {
    console.log(error);
  }
};

// export default sendPasswordLink;
module.exports = sendPasswordLink;
