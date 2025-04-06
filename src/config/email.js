const nodemailer = require("nodemailer");

// สร้าง transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // หรือใช้ SMTP ของเซิร์ฟเวอร์คุณเอง
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // รหัสผ่านแอปสำหรับ Gmail
  },
});

module.exports = transporter;
