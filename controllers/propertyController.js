const Property = require('../models/Property');
const {
  uploadImageFromBuffer,
  uploadVideoFromBuffer,
  deleteMultipleFiles,
  deleteFile
} = require('../utils/cloudinary');

/**
 * @desc    Get all properties with pagination
 * @route   GET /api/properties
 * @access  Public
 */
const getAllProperties = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const properties = await Property.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Property.countDocuments();

    res.json({
      success: true,
      count: properties.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: properties
    });
  } catch (error) {
    console.error('getAllProperties ERROR:', error);
    next(error);
  }
};

/**
 * @desc    Get single property by ID
 * @route   GET /api/properties/:id
 * @access  Public
 */
const getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    console.error('getPropertyById ERROR:', error);
    next(error);
  }
};

/**
 * @desc    Create new property with images and video
 * @route   POST /api/properties
 * @access  Private (Admin only)
 */
const createProperty = async (req, res, next) => {
  console.log('=== createProperty START ===');
  console.log('req.body:', req.body);
  console.log('req.files:', req.files);

  try {
    const {
      title,
      description,
      price,
      bhk,
      bathrooms,
      city,
      address,
      area,
      amenities,
      featured,
      status
    } = req.body;

    // Required fields
    if (!title || !price || !city || !bhk || !bathrooms || !area) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    // Parse amenities
    let amenitiesArray = [];
    if (amenities) {
      if (typeof amenities === 'string') {
        try {
          amenitiesArray = JSON.parse(amenities);
        } catch {
          amenitiesArray = amenities.split(',').map(a => a.trim()).filter(a => a);
        }
      } else if (Array.isArray(amenities)) {
        amenitiesArray = amenities;
      }
    }

    // Upload images
    let uploadedImages = [];
    if (req.files?.images) {
      const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      
      if (imageFiles.length > 5) {
        return res.status(400).json({ success: false, message: 'Maximum 5 images allowed' });
      }

      const uploadPromises = imageFiles.map(file => uploadImageFromBuffer(file.buffer));
      uploadedImages = await Promise.all(uploadPromises);
    }

    // Upload video
    let uploadedVideo = null;
    if (req.files?.video?.[0]) {
      uploadedVideo = await uploadVideoFromBuffer(req.files.video[0].buffer);
    }

    // Create property
    const property = await Property.create({
      title,
      description: description || '',
      price: parseFloat(price),
      bhk: parseInt(bhk),
      bathrooms: parseInt(bathrooms),
      city,
      address: address || '',
      area: parseFloat(area),
      amenities: amenitiesArray,
      images: uploadedImages,
      video: uploadedVideo,
      featured: featured === 'true' || featured === true,
      status: status || 'available'
    });

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property
    });
  } catch (error) {
    console.error('createProperty ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create property',
      error: error.message
    });
  }
};

/**
 * @desc    Update property
 * @route   PUT /api/properties/:id
 * @access  Private (Admin only)
 */
const updateProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const {
      title,
      description,
      price,
      bhk,
      bathrooms,
      city,
      address,
      area,
      amenities,
      featured,
      status
    } = req.body;

    // Update fields
    if (title) property.title = title;
    if (description) property.description = description;
    if (price) property.price = parseFloat(price);
    if (bhk) property.bhk = parseInt(bhk);
    if (bathrooms) property.bathrooms = parseInt(bathrooms);
    if (city) property.city = city;
    if (address) property.address = address;
    if (area) property.area = parseFloat(area);
    if (featured !== undefined) property.featured = featured === 'true' || featured === true;
    if (status) property.status = status;

    // Update amenities
    if (amenities) {
      let amenitiesArray = [];
      if (typeof amenities === 'string') {
        try {
          amenitiesArray = JSON.parse(amenities);
        } catch {
          amenitiesArray = amenities.split(',').map(a => a.trim()).filter(a => a);
        }
      } else if (Array.isArray(amenities)) {
        amenitiesArray = amenities;
      }
      property.amenities = amenitiesArray;
    }

    // Add new images
    if (req.files?.images) {
      const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      if (property.images.length + imageFiles.length > 5) {
        return res.status(400).json({ success: false, message: 'Total images cannot exceed 5' });
      }
      const uploadPromises = imageFiles.map(file => uploadImageFromBuffer(file.buffer));
      const newImages = await Promise.all(uploadPromises);
      property.images = [...property.images, ...newImages];
    }

    // Replace video
    if (req.files?.video?.[0]) {
      if (property.video?.publicId) {
        await deleteFile(property.video.publicId, 'video');
      }
      const newVideo = await uploadVideoFromBuffer(req.files.video[0].buffer);
      property.video = newVideo;
    }

    await property.save();

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: property
    });
  } catch (error) {
    console.error('updateProperty ERROR:', error);
    next(error);
  }
};

/**
 * @desc    Delete property
 * @route   DELETE /api/properties/:id
 * @access  Private (Admin only)
 */
const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Delete from Cloudinary
    if (property.images?.length > 0) {
      const publicIds = property.images.map(img => img.publicId).filter(Boolean);
      if (publicIds.length > 0) await deleteMultipleFiles(publicIds, 'image');
    }
    if (property.video?.publicId) {
      await deleteFile(property.video.publicId, 'video');
    }

    await property.deleteOne();

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('deleteProperty ERROR:', error);
    next(error);
  }
};

/**
 * @desc    Delete single image from property
 * @route   DELETE /api/properties/:id/images/:imageIndex
 * @access  Private (Admin only)
 */
const deletePropertyImage = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const imageIndex = parseInt(req.params.imageIndex);
    if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= property.images.length) {
      return res.status(400).json({ success: false, message: 'Invalid image index' });
    }

    const image = property.images[imageIndex];
    if (image.publicId) {
      await deleteFile(image.publicId, 'image');
    }

    property.images.splice(imageIndex, 1);
    await property.save();

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: property
    });
  } catch (error) {
    console.error('deletePropertyImage ERROR:', error);
    next(error);
  }
};

/**
 * @desc    Filter properties
 * @route   GET /api/properties/filter
 * @access  Public
 */
const filterProperties = async (req, res, next) => {
  try {
    const { city, minPrice, maxPrice, bhk, sort } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    if (city) query.city = { $regex: city, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (bhk) query.bhk = parseInt(bhk);

    let sortQuery = { createdAt: -1 };
    if (sort === 'price_asc') sortQuery = { price: 1 };
    else if (sort === 'price_desc') sortQuery = { price: -1 };
    else if (sort === 'bhk_asc') sortQuery = { bhk: 1 };
    else if (sort === 'bhk_desc') sortQuery = { bhk: -1 };

    const properties = await Property.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    const total = await Property.countDocuments(query);

    res.json({
      success: true,
      count: properties.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: properties
    });
  } catch (error) {
    console.error('filterProperties ERROR:', error);
    next(error);
  }
};

/**
 * @desc    Get all cities
 * @route   GET /api/properties/cities
 * @access  Public
 */
const getCities = async (req, res, next) => {
  try {
    const cities = await Property.distinct('city');
    res.json({
      success: true,
      count: cities.length,
      data: cities.sort()
    });
  } catch (error) {
    console.error('getCities ERROR:', error);
    next(error);
  }
};

module.exports = {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  deletePropertyImage,
  filterProperties,
  getCities
};