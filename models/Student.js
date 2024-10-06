// models/Student.js

const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  address: {
    city: String,
    state: String,
  },
  eyeColor: String,
  // Add other fields as needed
});

module.exports = mongoose.model('Student', studentSchema);
