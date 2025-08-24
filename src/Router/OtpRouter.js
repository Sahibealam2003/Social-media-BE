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

router.post("/otp/send-otp", otpLimiter ,async (req, res) => {
  try {
    const { email } = req.body;
    const foundUser = await VerifiedMail.findOne({ mail: email });
    if (foundUser) {
      throw new Error("Mail already vetifyrd");
    }
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = generateOTP();
    console.log("Generated OTP:", otp);

    // Send email
    await transporter.sendMail({
      from: `"Sahib e Alam" <${process.env.MAIL_ID}>`,
      to: email,
      subject: "🔐 Your OTP Code",
      html: ` 
        ... same fancy HTML template ...
        <span style="font-size:32px; font-weight:bold; letter-spacing:4px; color:#2E7D32;">${otp}</span>
        ... rest of template ...
      `,
    });

    // Save OTP in DB
    await OTP.create({ mail: email, otp, createdAt: Date.now() });

    return res.status(200).json({ message: "OTP sent successfully!" });
  } catch (error) {
   
    // Default fallback error
    return res.status(500).json({

      error: error.message,
    });
  }
});

router.post("/otp/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ msg: "Email and OTP are required" });
    }

    const foundUser = await VerifiedMail.findOne({ mail: email });
    if (foundUser) {
      return res.status(400).json({ msg: "Mail already verified" });
    }

    const foundOtp = await OTP.findOne({
      $and: [{ mail: email }, { otp: otp }],
    });

    if (!foundOtp) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    await VerifiedMail.create({ mail: email });
    res.status(200).json({ msg: "Done" });
  } catch (error) {
    console.error("OTP Verification Error:", error.message);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

module.exports = {
  router,
};
