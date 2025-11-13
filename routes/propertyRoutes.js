const express = require("express");
const router = express.Router();
const {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  deletePropertyImage,
  filterProperties,
  getCities,
} = require("../controllers/propertyController");
const { protect } = require("../middleware/authMiddleware");
const { uploadPropertyMedia } = require("../middleware/upload");

// Public routes
router.get("/", getAllProperties);
router.get("/filter", filterProperties);
router.get("/cities", getCities);
router.get("/:id", getPropertyById);

// Admin (protected) routes
router.post("/", protect, uploadPropertyMedia, createProperty);
router.put("/:id", protect, uploadPropertyMedia, updateProperty);
router.delete("/:id", protect, deleteProperty);
router.delete("/:id/images/:imageIndex", protect, deletePropertyImage);

module.exports = router;
