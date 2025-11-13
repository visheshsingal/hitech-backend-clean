const Enquiry = require('../models/Enquiry');
const Property = require('../models/Property');

/**
 * @desc    Submit new enquiry
 * @route   POST /api/enquiries
 * @access  Public
 */
const submitEnquiry = async (req, res, next) => {
  try {
    const { name, email, phone, message, propertyId } = req.body;

    // Validation
    if (!name || !email || !phone || !message || !propertyId) {
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      res.status(404);
      throw new Error('Property not found');
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      res.status(400);
      throw new Error('Please provide a valid 10-digit phone number');
    }

    // Create enquiry
    const enquiry = await Enquiry.create({
      name,
      email,
      phone,
      message,
      propertyId
    });

    // Populate property details
    await enquiry.populate('propertyId', 'title price city address');

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully. We will contact you soon!',
      data: enquiry
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all enquiries with pagination
 * @route   GET /api/enquiries
 * @access  Private (Admin only)
 */
const getAllEnquiries = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    // Build query
    let query = {};
    if (status && ['pending', 'contacted', 'closed'].includes(status)) {
      query.status = status;
    }

    const enquiries = await Enquiry.find(query)
      .populate('propertyId', 'title price city address images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Enquiry.countDocuments(query);

    res.json({
      success: true,
      count: enquiries.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: enquiries
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single enquiry by ID
 * @route   GET /api/enquiries/:id
 * @access  Private (Admin only)
 */
const getEnquiryById = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id)
      .populate('propertyId', 'title price city address images videos bhk bathrooms');

    if (!enquiry) {
      res.status(404);
      throw new Error('Enquiry not found');
    }

    res.json({
      success: true,
      data: enquiry
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get enquiries by property ID
 * @route   GET /api/enquiries/property/:propertyId
 * @access  Private (Admin only)
 */
const getEnquiriesByProperty = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const enquiries = await Enquiry.find({ propertyId: req.params.propertyId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Enquiry.countDocuments({ propertyId: req.params.propertyId });

    res.json({
      success: true,
      count: enquiries.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: enquiries
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update enquiry status
 * @route   PUT /api/enquiries/:id/status
 * @access  Private (Admin only)
 */
const updateEnquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'contacted', 'closed'].includes(status)) {
      res.status(400);
      throw new Error('Please provide a valid status (pending, contacted, closed)');
    }

    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      res.status(404);
      throw new Error('Enquiry not found');
    }

    enquiry.status = status;
    await enquiry.save();

    await enquiry.populate('propertyId', 'title price city address');

    res.json({
      success: true,
      message: 'Enquiry status updated successfully',
      data: enquiry
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete enquiry
 * @route   DELETE /api/enquiries/:id
 * @access  Private (Admin only)
 */
const deleteEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      res.status(404);
      throw new Error('Enquiry not found');
    }

    await enquiry.deleteOne();

    res.json({
      success: true,
      message: 'Enquiry deleted successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get enquiry statistics
 * @route   GET /api/enquiries/stats
 * @access  Private (Admin only)
 */
const getEnquiryStats = async (req, res, next) => {
  try {
    const total = await Enquiry.countDocuments();
    const pending = await Enquiry.countDocuments({ status: 'pending' });
    const contacted = await Enquiry.countDocuments({ status: 'contacted' });
    const closed = await Enquiry.countDocuments({ status: 'closed' });

    res.json({
      success: true,
      data: {
        total,
        pending,
        contacted,
        closed
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitEnquiry,
  getAllEnquiries,
  getEnquiryById,
  getEnquiriesByProperty,
  updateEnquiryStatus,
  deleteEnquiry,
  getEnquiryStats
};