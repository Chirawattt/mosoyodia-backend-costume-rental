const express = require("express");
const router = express.Router();
const {
  getAllCostumes,
  getCostumeById,
  createCostume,
  updateCostume,
  deleteCostume,
  upload,
} = require("../controllers/costumeController");

// Get all costumes
router.get("/", getAllCostumes);

// Get costume by ID
router.get("/:id", getCostumeById);

// Create new costume
router.post("/", upload.single("image"), createCostume);

// Update costume
router.put("/:id", upload.single("image"), updateCostume);

// Delete costume
router.delete("/:id", deleteCostume);

module.exports = router;
