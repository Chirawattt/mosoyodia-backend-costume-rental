const express = require("express");
const router = express.Router();
const {
  getAllCostumes,
  getCostumeById,
  createCostume,
  updateCostume,
  deleteCostume,
  getAllRentableCostumes,
  upload,
  getAllCostumesByCategory,
  getAllReviewImageByCostumeId,
  updateCostumeStatus,
  updateCostumeRentableStatus,
  resetAllCostumesStatus,
} = require("../controllers/costumeController");

// Get all costumes
router.get("/", getAllCostumes);

// Get all rentable costumes
router.get("/rentable", getAllRentableCostumes);

// Get all costumes by category
router.get("/category/:category", getAllCostumesByCategory);

// GET all reviewImage by costume id
router.get("/:id/reviewImage", getAllReviewImageByCostumeId);

// Get costume by ID
router.get("/:id", getCostumeById);

// Create new costume
router.post("/", upload.single("image"), createCostume);

// Reset all costumes status
router.post("/resetStatus", resetAllCostumesStatus);

// Update status of costume
router.put("/:id/status", updateCostumeStatus);

// update rentable status of costume
router.put("/:id/isRentable", updateCostumeRentableStatus);

// Update costume
router.put("/:id", upload.single("image"), updateCostume);

// Delete costume
router.delete("/:id", deleteCostume);

module.exports = router;
