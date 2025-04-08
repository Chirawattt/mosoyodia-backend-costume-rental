const express = require("express");
const router = express.Router();
const {
  getAllReviewImages,
  getReviewImageById,
  uploadReviewImage,
  deleteReviewImage,
  upload,
} = require("../controllers/reviewImageController");

// GET รูปภาพทั้งหมด
router.get("/", getAllReviewImages);

// GET รูปภาพตาม id
router.get("/:image_id", getReviewImageById);

// POST อัปโหลดรูปภาพ
router.post("/upload", upload.single("image"), uploadReviewImage);

// DELETE ลบรูปภาพ
router.delete("/:image_id", deleteReviewImage);

module.exports = router;
