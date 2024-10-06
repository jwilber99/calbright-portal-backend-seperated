// src/models/Device.js

const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student', // Assuming devices are assigned to students
    required: false,
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active',
  },
  // Add other relevant fields as needed
}, { timestamps: true });

module.exports = mongoose.model('Device', DeviceSchema);
