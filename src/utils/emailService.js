const nodemailer = require("nodemailer");

// กำหนดค่า transporter สำหรับส่งอีเมล
const transporter = nodemailer.createTransport({
  service: "gmail", // หรือใช้ host, port สำหรับ SMTP server อื่นๆ
  auth: {
    user: process.env.EMAIL_USER, // อีเมลที่จะใช้ส่ง
    pass: process.env.EMAIL_PASSWORD, // รหัสผ่านหรือ app password
  },
});

// ฟังก์ชันสำหรับส่ง OTP ไปยังอีเมล
const sendOtpEmail = async (to, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: "รหัส OTP สำหรับรีเซ็ตรหัสผ่าน",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">รหัสยืนยันการรีเซ็ตรหัสผ่าน</h2>
          <p style="font-size: 16px; color: #555;">เรียนผู้ใช้งาน,</p>
          <p style="font-size: 16px; color: #555;">รหัส OTP สำหรับการรีเซ็ตรหัสผ่านของคุณคือ:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h1 style="font-size: 32px; margin: 0; letter-spacing: 5px; color: #333;">${otp}</h1>
          </div>
          <p style="font-size: 16px; color: #555;">รหัสนี้จะหมดอายุใน 10 นาที</p>
          <p style="font-size: 16px; color: #555;">หากคุณไม่ได้ร้องขอการรีเซ็ตรหัสผ่าน กรุณาละเลยอีเมลนี้</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 14px; color: #999; margin: 0;">ขอแสดงความนับถือ,<br>ทีมงาน Moso Yodia</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("อีเมลถูกส่งแล้ว:", info.messageId);
    return true;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการส่งอีเมล:", error);
    throw error;
  }
};

module.exports = {
  sendOtpEmail,
};
