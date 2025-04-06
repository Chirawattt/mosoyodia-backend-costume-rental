const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OTP = require("../models/OTP");
const authMiddleware = require("../middleware/authMiddleware");
const { Op } = require("sequelize");
const { sendOtpEmail } = require("../utils/emailService");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;

    // ตรวจสอบว่า username ไม่ซ้ำ
    const isUsernameExists = await User.findOne({ where: { username } });
    if (isUsernameExists) {
      return res.status(400).json({
        error: "ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้วโปรดเปลี่ยนชื่อผู้ใช้งาน",
      });
    }

    // ตรวจสอบว่า email ไม่ซ้ำ
    const isEmailExists = await User.findOne({ where: { email } });
    if (isEmailExists) {
      return res.status(400).json({
        error: "อีเมลนี้มีอยู่ในระบบแล้วโปรดเปลี่ยนอีเมล",
      });
    }

    // สร้างผู้ใช้ใหม่
    const newUser = await User.create({
      username,
      password, // รหัสผ่านจะถูกเข้ารหัสโดยอัตโนมัติจาก hook
      email,
      phone,
    });

    // สร้าง token
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.userRole },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ส่งข้อมูลผู้ใช้กลับ (ไม่รวมรหัสผ่าน)
    const userResponse = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      phone: newUser.phone,
      userRole: newUser.userRole,
    };

    res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      error: "เกิดข้อผิดพลาดในการลงทะเบียน",
      details: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // หา user จาก username
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ error: "ไม่พบผู้ใช้งาน" });

    // ตรวจสอบรหัสผ่านโดยใช้ method จากโมเดล User
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: "รหัสผ่านไม่ถูกต้อง" });

    // สร้าง JWT Token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "4h",
    });

    res.json({ message: "เข้าสู่ระบบสำเร็จ", token, user });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ขอรีเซ็ตรหัสผ่านโดยส่ง OTP ไปที่อีเมล
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // ตรวจสอบว่ามีผู้ใช้ที่ใช้อีเมลนี้หรือไม่
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้งานที่มีอีเมลนี้" });
    }

    // สร้างรหัส OTP แบบสุ่ม 6 หลัก
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // กำหนดเวลาหมดอายุให้กับ OTP (10 นาที)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // บันทึกรหัส OTP ลงในฐานข้อมูล
    await OTP.create({
      userId: user.id,
      email,
      otp,
      expiresAt,
      isUsed: false,
      type: "email",
    });

    // ส่งรหัส OTP ไปยังอีเมลของผู้ใช้
    await sendOtpEmail(email, otp);

    res.json({
      message: "ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบอีเมล",
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      error: "เกิดข้อผิดพลาดในการส่ง OTP",
      details: error.message,
    });
  }
});

// ตรวจสอบรหัส OTP และรีเซ็ตรหัสผ่าน
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // ตรวจสอบว่ามีรหัส OTP ที่ถูกต้องและยังไม่หมดอายุหรือไม่
    const otpRecord = await OTP.findOne({
      where: {
        email,
        otp,
        expiresAt: { [Op.gt]: new Date() }, // expiresAt > current time คืนค่าเป็น true หรือ false
        isUsed: false,
        type: "email",
      },
    });

    // ตอบกลับว่า รหัส OTP ไม่ถูกต้อง
    if (!otpRecord) {
      return res.status(400).json({
        error: "รหัส OTP ไม่ถูกต้อง",
      });
    }

    // ตรวจสอบว่ารหัส OTP ถูกใช้แล้วหรือยัง
    if (otpRecord.isUsed) {
      return res.status(400).json({
        error: "รหัส OTP ถูกใช้แล้ว",
      });
    }

    // ตรวจสอบว่ารหัส OTP หมดอายุหรือยัง
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        error: "รหัส OTP หมดอายุแล้ว",
      });
    }

    // ค้นหาผู้ใช้จากอีเมล
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้ที่มีอีเมลนี้" });
    }

    // เข้ารหัสรหัสผ่านใหม่
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // อัปเดตรหัสผ่านใหม่โดยตรงในฐานข้อมูล ไม่ผ่าน hooks
    await User.update(
      { password: hashedPassword },
      {
        where: { id: user.id },
        individualHooks: false, // ป้องกันการเรียกใช้ beforeUpdate hook
      }
    );

    // ทำเครื่องหมายว่ารหัส OTP ถูกใช้แล้ว
    await otpRecord.update({ isUsed: true });

    res.json({
      message:
        "รีเซ็ตรหัสผ่านสำเร็จ คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว",
    });
  } catch (error) {
    console.error("Error in reset password:", error);
    res.status(500).json({
      error: "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน",
      details: error.message,
    });
  }
});

// ดึงรายชื่อผู้ใช้ที่มีทั้งหมด - จำเป็นต้องเป็น admin เท่านั้น
router.get("/users", authMiddleware, async (req, res) => {
  try {
    // ตรวจสอบว่าผู้ใช้ที่ร้องขอเป็น admin หรือไม่
    const adminUser = await User.findByPk(req.user.userId);
    if (!adminUser || adminUser.userRole !== "admin") {
      return res.status(403).json({
        error: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้ เฉพาะผู้ดูแลระบบเท่านั้น",
      });
    }

    // ดึงรายชื่อผู้ใช้ที่มีทั้งหมด
    const users = await User.findAll({
      attributes: { exclude: ["password"] }, // ไม่ส่งรหัสผ่านกลับไป
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้",
      details: error.message,
    });
  }
});

// อัปเดตข้อมูลผู้ใช้ - สำหรับผู้ใช้อัปเดตข้อมูลตนเอง หรือ admin อัปเดตข้อมูลผู้ใช้คนอื่น
router.put("/users/:id", authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, email, phone, userRole } = req.body;

    // ตรวจสอบว่าผู้ใช้ที่ร้องขอเป็นเจ้าของบัญชีหรือเป็น admin
    const requestingUser = await User.findByPk(req.user.userId);
    const isAdmin = requestingUser && requestingUser.userRole === "admin";
    const isSelfUpdate = req.user.userId === userId;

    if (!isAdmin && !isSelfUpdate) {
      return res.status(403).json({
        error: "ไม่มีสิทธิ์แก้ไขข้อมูลของผู้ใช้อื่น",
      });
    }

    // ตรวจสอบว่าผู้ใช้ที่จะอัปเดตมีอยู่จริง
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้ที่ต้องการแก้ไข" });
    }

    // ตรวจสอบว่าชื่อผู้ใช้หรืออีเมลไม่ซ้ำกับผู้ใช้อื่น
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({
        where: { username, id: { [Op.ne]: userId } },
      });
      if (existingUsername) {
        return res.status(400).json({
          error: "ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว กรุณาเลือกชื่อผู้ใช้อื่น",
        });
      }
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({
        where: { email, id: { [Op.ne]: userId } },
      });
      if (existingEmail) {
        return res.status(400).json({
          error: "อีเมลนี้มีอยู่ในระบบแล้ว กรุณาใช้อีเมลอื่น",
        });
      }
    }

    // สร้างข้อมูลที่จะอัปเดต
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    // อนุญาตให้เปลี่ยน userRole เฉพาะ admin เท่านั้น
    if (userRole && isAdmin) updateData.userRole = userRole;

    // อัปเดตข้อมูลผู้ใช้
    await User.update(updateData, {
      where: { id: userId },
      individualHooks: true, // อนุญาตให้ hookstำงานในกรณีที่มีการเปลี่ยนรหัสผ่าน
    });

    // ดึงข้อมูลผู้ใช้ที่อัปเดตแล้ว
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    res.json({
      message: "อัปเดตข้อมูลผู้ใช้สำเร็จ",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้",
      details: error.message,
    });
  }
});

// ลบผู้ใช้ - เฉพาะ admin เท่านั้น
router.delete("/users/:id", authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // ตรวจสอบว่าผู้ใช้ที่ร้องขอเป็น admin หรือไม่
    const adminUser = await User.findByPk(req.user.userId);
    if (!adminUser || adminUser.userRole !== "admin") {
      return res.status(403).json({
        error: "ไม่มีสิทธิ์ลบผู้ใช้ เฉพาะผู้ดูแลระบบเท่านั้น",
      });
    }

    // ตรวจสอบว่าไม่ได้พยายามลบตัวเอง
    if (req.user.userId === userId) {
      return res.status(400).json({
        error: "ไม่สามารถลบบัญชีของตัวเองได้",
      });
    }

    // ตรวจสอบว่าผู้ใช้ที่จะลบมีอยู่จริง
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้ที่ต้องการลบ" });
    }

    // ลบผู้ใช้
    await user.destroy();

    res.json({
      message: "ลบผู้ใช้สำเร็จ",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      error: "เกิดข้อผิดพลาดในการลบผู้ใช้",
      details: error.message,
    });
  }
});

module.exports = router;
