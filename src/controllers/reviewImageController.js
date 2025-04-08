const ReviewImage = require("../models/ReviewImage");
const { uploadImage, deleteImage } = require("../utils/uploadImage");
const multer = require("multer");

// ตั้งค่า multer สำหรับเก็บไฟล์ในหน่วยความจำ
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// GET รูปภาพทั้งหมด
const getAllReviewImages = async (req, res) => {
  try {
    const images = await ReviewImage.findAll();
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET รูปภาพตาม costume_id
const getReviewImagesByCostumeId = async (req, res) => {
  try {
    const images = await ReviewImage.findAll({
      where: { costume_id: req.params.costume_id },
    });
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET รูปภาพตาม id
const getReviewImageById = async (req, res) => {
  try {
    const image = await ReviewImage.findOne({
      where: { id: req.params.image_id },
    });

    if (!image) {
      return res.status(404).json({ error: "ไม่พบรูปภาพ" });
    }

    res.json(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST อัปโหลดรูปภาพ
const uploadReviewImage = async (req, res) => {
  try {
    const { costume_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "กรุณาอัปโหลดรูปภาพ" });
    }

    try {
      // อัพโหลด buffer ไปยัง Cloudinary โดยตรง
      const imageData = await uploadImage(req.file.buffer, "reviews");

      const newReviewImage = await ReviewImage.create({
        costume_id,
        image_path: imageData.url,
        image_public_id: imageData.public_id,
      });

      res.json({
        message: "เพิ่มรูปภาพรีวิวสำเร็จ",
        reviewImage: newReviewImage,
      });
    } catch (error) {
      console.error("Error processing image:", error);
      res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการเพิ่มรูปรีวิว" });
  }
};

// DELETE ลบรูปภาพ
const deleteReviewImage = async (req, res) => {
  try {
    const reviewImage = await ReviewImage.findOne({
      where: { id: req.params.image_id },
    });

    if (!reviewImage) {
      return res.status(404).json({ error: "ไม่พบรูปภาพที่ต้องการลบ" });
    }

    // ลบรูปจาก Cloudinary ถ้ามี public_id
    if (reviewImage.image_public_id) {
      await deleteImage(reviewImage.image_public_id);
    }

    // ลบข้อมูลจากฐานข้อมูล
    await ReviewImage.destroy({ where: { id: req.params.image_id } });
    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllReviewImages,
  getReviewImagesByCostumeId,
  getReviewImageById,
  uploadReviewImage,
  deleteReviewImage,
  upload,
};
