const Costume = require("../models/Costume");
const { uploadImage, deleteImage } = require("../utils/uploadImage");
const multer = require("multer");
const path = require("path");

// ตั้งค่า multer สำหรับเก็บไฟล์ชั่วคราว
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "temp/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// Get all costumes
const getAllCostumes = async (req, res) => {
  try {
    const costumes = await Costume.findAll();
    res.json(costumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get costume by ID
const getCostumeById = async (req, res) => {
  try {
    const costume = await Costume.findByPk(req.params.id);
    if (!costume) {
      return res.status(404).json({ message: "Costume not found" });
    }
    res.json(costume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new costume
const createCostume = async (req, res) => {
  try {
    const { name, price, age_group, status, isRentable, category } = req.body;
    let imageData = null;

    if (req.file) {
      imageData = await uploadImage(req.file, "costumes");
    }

    const costume = await Costume.create({
      name,
      price,
      age_group,
      status,
      isRentable,
      category,
      image_path: imageData?.url || null,
      image_public_id: imageData?.public_id || null,
    });

    res.status(201).json(costume);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update costume
const updateCostume = async (req, res) => {
  try {
    const { name, price, age_group, status, isRentable, category } = req.body;
    const costume = await Costume.findByPk(req.params.id);

    if (!costume) {
      return res.status(404).json({ message: "Costume not found" });
    }

    let imageData = null;
    if (req.file) {
      // ลบรูปเก่าถ้ามี
      if (costume.image_public_id) {
        await deleteImage(costume.image_public_id);
      }
      // อัพโหลดรูปใหม่
      imageData = await uploadImage(req.file, "costumes");
    }

    await costume.update({
      name,
      price,
      age_group,
      status,
      isRentable,
      category,
      image_path: imageData?.url || costume.image_path,
      image_public_id: imageData?.public_id || costume.image_public_id,
    });

    res.json(costume);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete costume
const deleteCostume = async (req, res) => {
  try {
    const costume = await Costume.findByPk(req.params.id);

    if (!costume) {
      return res.status(404).json({ message: "Costume not found" });
    }

    // ลบรูปจาก Cloudinary ถ้ามี
    if (costume.image_public_id) {
      await deleteImage(costume.image_public_id);
    }

    await costume.destroy();
    res.json({ message: "Costume deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllCostumes,
  getCostumeById,
  createCostume,
  updateCostume,
  deleteCostume,
  upload,
};
