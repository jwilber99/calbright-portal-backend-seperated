// seedStudents.js

const mongoose = require('mongoose');
const Student = require('./models/Student');
const studentsData = require('./studentsData.json'); // Make sure this path is correct

require('dotenv').config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    // Clear existing data
    await Student.deleteMany({});

    // Insert new data
    await Student.insertMany(studentsData);

    console.log('Student data seeded successfully');
    process.exit();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
