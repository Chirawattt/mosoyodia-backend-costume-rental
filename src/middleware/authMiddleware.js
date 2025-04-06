const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  let token = req.header("Authorization"); // ดึงค่า token จาก Header ที่ชื่อ Authorization มาใช้ในการ verify
  if (!token) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบ" }); // ถ้าไม่มี token ให้ส่ง error 401 กลับไป

  // รองรับทั้งแบบมี "Bearer " และแบบไม่มี
  token = token.startsWith("Bearer ") ? token.replace("Bearer ", "") : token;

  try {
    // ใช้ jwt.verify เพื่อตรวจสอบ token ว่าถูกต้องหรือไม่
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // ถ้า token ถูกต้อง ให้ส่ง decoded ไปให้ request ต่อไป
    next(); // แล้วทำ middleware ต่อไป
  } catch (error) {
    res.status(401).json({ error: "Token ไม่ถูกต้อง" });
  }
};

module.exports = authMiddleware;
