const express = require('express');
const router = express.Router();
const {
  submitEnquiry,
  getAllEnquiries,
  getEnquiryById,
  getEnquiriesByProperty,
  updateEnquiryStatus,
  deleteEnquiry,
  getEnquiryStats
} = require('../controllers/enquiryController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/', submitEnquiry);

// Protected routes (Admin only)
router.get('/', protect, getAllEnquiries);
router.get('/stats', protect, getEnquiryStats);
router.get('/property/:propertyId', protect, getEnquiriesByProperty);
router.get('/:id', protect, getEnquiryById);
router.put('/:id/status', protect, updateEnquiryStatus);
router.delete('/:id', protect, deleteEnquiry);

module.exports = router;