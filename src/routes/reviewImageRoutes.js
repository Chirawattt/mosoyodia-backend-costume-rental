const express = require("express");
const router = express.Router();
const multer = require("multer"); // เอาไว้สำหรับรับไฟล์จาก
const path = require("path");
const fs = require("fs");
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

// GET รูปภาพทั้งหมด
router.get("/", async (req, res) => {
  try {
    const images = await ReviewImage.findAll();
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET รูปภาพตาม costume_id
router.get("/costume/:costume_id", async (req, res) => {
  try {
    const images = await ReviewImage.findAll({
      where: { costume_id: req.params.costume_id },
    });
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET รูปภาพตาม id
router.get("/:image_id", async (req, res) => {
  try {
    const image = await ReviewImage.findOne({
      where: { id: req.params.image_id },
    });
    res.json(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST อัปโหลดรูปภาพ
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const { costume_id } = req.body;
    const image_path = req.file ? `uploads/${req.file.filename}` : null;

    if (!image_path) {
      return res.status(400).json({ error: "กรุณาอัปโหลดรูปภาพ" });
    }

    const newReviewImage = await ReviewImage.create({
      costume_id,
      image_path,
    });

    res.json({
      message: "เพิ่มรูปภาพรีวิวสำเร็จ",
      reviewImage: newReviewImage,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการเพิ่มรูปรีวิว" });
  }
});

// DELETE ลบรูปภาพ
router.delete("/:image_id", async (req, res) => {
  try {
    // ลบไฟล์จากโฟลเดอร์
    const reviewImage = await ReviewImage.findOne({
      where: { id: req.params.image_id },
    });
    if (!reviewImage) {
      return res.status(404).json({ error: "ไม่พบรูปภาพที่ต้องการลบ" });
    }

    if (reviewImage.image_path) {
      const imagePath = path.join(
        __dirname,
        "../../public",
        reviewImage.image_path
      );

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath); // ลบไฟล์รูปออกจากโฟลเดอร์
      }
    }
    // ลบข้อมูลจากฐานข้อมูล
    await ReviewImage.destroy({ where: { id: req.params.image_id } });
    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  Frontend สามารถดึงรูปได้ที่ http://localhost:5000/uploads/filename.jpg

module.exports = router;
