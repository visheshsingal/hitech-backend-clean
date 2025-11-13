const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a property title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price cannot be negative']
  },
  bhk: {
    type: Number,
    required: [true, 'Please specify BHK'],
    min: [1, 'BHK must be at least 1'],
    max: [10, 'BHK cannot exceed 10']
  },
  bathrooms: {
    type: Number,
    required: [true, 'Please specify number of bathrooms'],
    min: [1, 'Bathrooms must be at least 1'],
    max: [10, 'Bathrooms cannot exceed 10']
  },
  city: {
    type: String,
    required: [true, 'Please add a city'],
    trim: true,
    index: true
  },
  address: {
    type: String,
    required: [true, 'Please add an address'],
    trim: true
  },
  area: {
    type: String,
    trim: true
  },
  amenities: [{
    type: String,
    trim: true
  }],
  images: {
    type: [{
      url: String,
      publicId: String
    }],
    default: [],
    validate: {
      validator: function(arr) {
        return arr.length <= 5;
      },
      message: 'Cannot upload more than 5 images'
    }
  },
  video: {
    url: String,
    publicId: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for filtering
propertySchema.index({ city: 1, price: 1 });

module.exports = mongoose.model('Property', propertySchema);