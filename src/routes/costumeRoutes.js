const express = require("express");
const multer = require("multer");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const authMiddleware = require("../middleware/authMiddleware");
const Costume = require("../models/Costume");
const ReviewImage = require("../models/ReviewImage");

// 📌 ตั้งค่าการอัปโหลดรูป
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../public/uploads");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// GET ชุดทั้งหมด
router.get("/", async (req, res) => {
  try {
    const costumes = await Costume.findAll();
    res.json(costumes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ชุดตามประเภท
router.get("/category/:category", async (req, res) => {
  try {
    const costumes = await Costume.findAll({
      where: { category: req.params.category },
    });
    res.json(costumes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ชุดที่ isRentable = true
router.get("/rentable", async (req, res) => {
  try {
    const costumes = await Costume.findAll({
      where: { isRentable: true },
    });
    res.json(costumes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ชุดตาม id
router.get("/:id", async (req, res) => {
  try {
    const costume = await Costume.findOne({
      where: { id: req.params.id },
    });
    res.json(costume);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST เพิ่มชุด พร้อมรูปภาพของชุด(หากมี)
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { name, price, category, age_group } = req.body;
    const image_path = req.file ? `uploads/${req.file.filename}` : null;

    const newCostume = await Costume.create({
      name,
      price,
      category,
      age_group,
      image_path,
    });

    res.json({ message: "เพิ่มชุดสำเร็จ", costume: newCostume });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการเพิ่มชุด" });
  }
});

// Reset สถานะของชุดทั้งหมดให้เป็นว่าง
router.put("/resetStatus", authMiddleware, async (req, res) => {
  try {
    await Costume.update({ status: 1 }, { where: {} });
    res.json({ message: "รีเซ็ตสถานะชุดทั้งหมดสำเร็จ" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT แก้ไขชุด
router.put("/:id", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { name, price, category, age_group } = req.body;

    // ค้นหาข้อมูลชุดเดิมเพื่อดึง image_path เก่า
    const existingCostume = await Costume.findOne({
      where: { id: req.params.id },
    });

    if (!existingCostume) {
      return res.status(404).json({ error: "ไม่พบข้อมูลชุดนี้" });
    }

    // เตรียมข้อมูลสำหรับอัปเดต
    const updateData = { name, price, category, age_group };

    // ถ้ามีการอัปโหลดรูปใหม่
    if (req.file) {
      // เพิ่ม path รูปใหม่
      updateData.image_path = `uploads/${req.file.filename}`;

      // ลบรูปเก่าออกจากเซิร์ฟเวอร์ (ถ้ามี)
      if (existingCostume.image_path) {
        const oldImagePath = path.join(
          __dirname,
          "../../public",
          existingCostume.image_path
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath); // ลบไฟล์รูปเก่า
        }
      }
    }

    // อัปเดตข้อมูลชุด
    await Costume.update(updateData, { where: { id: req.params.id } });

    res.json({ message: "อัปเดตข้อมูลชุดสำเร็จ" });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดตชุด" });
  }
});

// DELETE ลบชุด และลบรูปภาพที่อยู่ในโฟลเดอร์ uploads
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // 🔹 ค้นหาข้อมูลของชุดก่อน
    const costume = await Costume.findOne({ where: { id: req.params.id } });

    if (!costume) {
      return res.status(404).json({ error: "ไม่พบข้อมูลชุดนี้" });
    }

    // 🔹 ตรวจสอบว่ามีรูปภาพไหม และลบออกจากเซิร์ฟเวอร์
    if (costume.image_path) {
      const imagePath = path.join(
        __dirname,
        "../../public",
        costume.image_path
      );

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath); // ลบไฟล์รูปออกจากโฟลเดอร์
      }
    }

    // 🔹 ลบรูปภาพรีวิวทั้งหมดที่เกี่ยวข้องกับชุดนี้
    const reviewImages = await ReviewImage.findAll({
      where: { costume_id: req.params.id },
    });
    for (const reviewImage of reviewImages) {
      if (reviewImage.image_path) {
        const reviewImagePath = path.join(
          __dirname,
          "../../public",
          reviewImage.image_path
        );

        if (fs.existsSync(reviewImagePath)) {
          fs.unlinkSync(reviewImagePath); // ลบไฟล์รูปออกจากโฟลเดอร์
        }
      }
      await ReviewImage.destroy({ where: { id: reviewImage.id } }); // ลบข้อมูลรีวิวภาพในฐานข้อมูล
    }

    // 🔹 ลบชุดออกจากฐานข้อมูล
    await Costume.destroy({ where: { id: req.params.id } });

    res.json({ message: "ลบชุดสำเร็จ พร้อมลบรูปภาพออกจากเซิร์ฟเวอร์" });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบชุด" });
  }
});

// GET รูปภาพรีวิวทั้งหมดจาก id ของชุด
router.get("/:costume_id/reviewImages", async (req, res) => {
  try {
    const images = await ReviewImage.findAll({
      where: { costume_id: req.params.costume_id },
    });
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update สถานะของชุด
router.put("/:id/status", authMiddleware, async (req, res) => {
  const { status } = req.body; // ค่าที่ส่งมาจาก client
  try {
    await Costume.update({ status }, { where: { id: req.params.id } });
    res.json({ message: "อัปเดตสถานะชุดสำเร็จ" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update สถานะการให้บริการของชุด isRentable
router.put("/:id/isRentable", authMiddleware, async (req, res) => {
  const { isRentable } = req.body; // ค่าที่ส่งมาจาก client
  try {
    await Costume.update({ isRentable }, { where: { id: req.params.id } });
    res.json({ message: "อัปเดตสถานะการให้บริการชุดสำเร็จ" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
