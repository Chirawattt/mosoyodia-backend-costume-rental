require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const sequelize = require("./src/config/database");

const app = express();
const PORT = process.env.PORT || 5000;

const costumeRoutes = require("./src/routes/costumeRoutes");
const reviewImageRoutes = require("./src/routes/reviewImageRoutes");
const authRoutes = require("./src/routes/authRoutes");

// Ensure uploads directory exists
const publicUploadsDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(publicUploadsDir)) {
  fs.mkdirSync(publicUploadsDir, { recursive: true });
  console.log("Created public/uploads directory");
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // 🔥 ใช้สำหรับ `x-www-form-urlencoded`
app.use(bodyParser.json()); // ✅ ใช้ BodyParser สำหรับอ่านค่า `req.body`

// ตั้งค่าให้ Express ใช้ Static Files จาก `uploads/` เพื่อให้ดึงรูปภาพมาแสดงได้โดยตรง
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// เช่น {BASE_URL}/uploads/1741425254609-KMN00010001.jpg

// Routes
app.get("/", (req, res) => {
  res.send("Backend is running...");
});

// ใช้งาน costumeRoutes
app.use("/api/costumes", costumeRoutes);

// ใช้งาน reviewImageRoutes
app.use("/api/images", reviewImageRoutes);

// ใช้งาน authRoutes
app.use("/api/auth", authRoutes);

// ใช้งาน uploads ในโฟลเดอร์ public
app.use("/uploads", express.static("public/uploads")); // เสิร์ฟไฟล์รูปภาพ

// เชื่อมต่อกับฐานข้อมูลและสร้างตาราง
async function initializeDatabase() {
  try {
    // ทดสอบการเชื่อมต่อฐานข้อมูล
    await sequelize.authenticate();
    console.log("Connected to Railway Database");

    // สร้างตารางทั้งหมดตามโมเดลที่กำหนด แต่ไม่สร้างตารางใหม่ถ้ามีอยู่แล้ว
    await sequelize.sync({ force: false });
    console.log("Railway Database connected successfully");

    // เริ่มรันเซิร์ฟเวอร์
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Cannot connect to the database:", error);
  }
}

// เริ่มต้นแอปพลิเคชัน
initializeDatabase();
