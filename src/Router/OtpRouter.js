const express = require("express"); // ✅
const router = express.Router();
const nodemailer = require("nodemailer");
const { OTP } = require("../Models/OTP");
const { VerifiedMail } = require("../Models/VerifiedMail");
const {otpLimiter} =require('../Middlewares/OtpMiddlewares')


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_ID,
    pass: process.env.APP_PASSWORD,
  },
});

function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp.padStart(6, "0"); // hamesha 6 digit OTP
}

// Route to send OTP to a given email
router.post("/otp/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email is provided
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if the email is already verified
    const foundUser = await VerifiedMail.findOne({ mail: email });
    if (foundUser) {
      return res.status(400).json({ message: "Mail already verified" });
    }

    // Generate a new OTP
    const otp = generateOTP();

    // Send OTP email using transporter
    await transporter.sendMail({
      from: `"Sahib e Alam" <${process.env.MAIL_ID}>`,
      to: email,
      subject: "Your OTP Code",
      html: ` 
        ... fancy HTML template ...
        <span style="font-size:32px; font-weight:bold; letter-spacing:4px; color:#2E7D32;">${otp}</span>
        ... rest of template ...
      `,
    });

    // Store OTP in database with timestamp
    await OTP.create({ mail: email, otp, createdAt: Date.now() });

    // Return success response
    return res.status(200).json({ message: "OTP sent successfully!" });

  } catch (error) {
    // Catch unexpected errors and send 500 error response
    return res.status(500).json({ error: error.message });
  }
});

// Route to verify OTP for a given email
router.post("/otp/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate request body
    if (!email || !otp) {
      return res.status(400).json({ msg: "Email and OTP are required" });
    }

    // Check if email is already verified
    const foundUser = await VerifiedMail.findOne({ mail: email });
    if (foundUser) {
      return res.status(400).json({ msg: "Mail already verified" });
    }

    // Check if OTP exists and matches
    const foundOtp = await OTP.findOne({
      $and: [{ mail: email }, { otp: otp }],
    });

    if (!foundOtp) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    // Mark email as verified
    await VerifiedMail.create({ mail: email });

    // Return success response
    return res.status(200).json({ msg: "Email verified successfully" });

  } catch (error) {
    // Catch unexpected errors and send 500 error response
    return res.status(500).json({ error: error.message });
  }
});

module.exports = {
  router,
};
