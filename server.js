// server.js

require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const User = require('./models/User');
const Student = require('./models/Student'); // Import Student model
const Device = require('./models/Device'); // Import Device model


// Middleware
app.use(express.json());

// Configure CORS to allow credentials
app.use(
  cors({
    origin: 'http://localhost:3000', // Replace with your React app's origin
    credentials: true,
  })
);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Configure Session Middleware
app.use(
  session({
    secret: 'your_session_secret_key', // Replace with your own secret
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
    }),
    cookie: {
      maxAge: 1000 * 60 * 60, // Session expires after 1 hour
      sameSite: 'lax', // Adjust as needed for your setup
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
    },
  })
);

// Authentication Middleware
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

// Admin Authorization Middleware
function isAdmin(req, res, next) {
  if (req.session.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden' });
}

// Registration Route
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  console.log('Register attempt:', req.body); // Log incoming data

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('User already exists');
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      password: hashedPassword,
      role: 'user',
    });

    // Save user to the database
    await newUser.save();

    // Set user session
    req.session.userId = newUser._id;
    req.session.role = newUser.role;

    console.log('User registered successfully:', newUser);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ message: 'Server error during registration', error: err.message });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user in the database
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Set user session
    req.session.userId = user._id;
    req.session.role = user.role;

    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Logout Route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).json({ message: 'Server error during logout' });
    }
    res.clearCookie('connect.sid'); // Name of the session cookie
    res.json({ message: 'Logout successful' });
  });
});

// Authentication Status Route
app.get('/auth-status', (req, res) => {
  if (req.session.userId) {
    res.json({ authenticated: true, role: req.session.role });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// GET /devices - Fetch all devices
app.get('/devices', isAuthenticated, async (req, res) => {
  try {
    // Populate 'assignedTo' with 'firstName' and 'lastName'
    const devices = await Device.find().populate('assignedTo', 'firstName lastName email');
    res.json(devices);
  } catch (err) {
    console.error('Error fetching devices:', err);
    res.status(500).json({ message: 'Server error fetching devices' });
  }
});

// GET /devices/:id - Fetch single device
app.get('/devices/:id', isAuthenticated, async (req, res) => {
  try {
    const device = await Device.findById(req.params.id).populate('assignedTo', 'firstName lastName email');
    if (device) {
      res.json(device);
    } else {
      res.status(404).json({ message: 'Device not found' });
    }
  } catch (err) {
    console.error('Error fetching device:', err);
    res.status(500).json({ message: 'Server error fetching device' });
  }
});

// Create Device Route (Protected, Admin Only)
app.post('/devices', isAuthenticated, isAdmin, async (req, res) => {
  console.log('Received POST /devices request with body:', req.body);
  try {
    const newDevice = new Device(req.body);
    const savedDevice = await newDevice.save();
    res.status(201).json(savedDevice);
  } catch (err) {
    console.error('Error creating device:', err);
    if (err.name === 'ValidationError') {
      res.status(400).json({ message: 'Validation error', errors: err.errors });
    } else {
      res.status(500).json({ message: 'Server error creating device' });
    }
  }
});

// Update Device Route (Protected, Admin Only)
app.put('/devices/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const updatedDevice = await Device.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'firstName lastName email');
    
    if (!updatedDevice) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    res.json(updatedDevice);
  } catch (err) {
    console.error('Error updating device:', err);
    if (err.name === 'ValidationError') {
      res.status(400).json({ message: 'Validation error', errors: err.errors });
    } else {
      res.status(500).json({ message: 'Server error updating device' });
    }
  }
});

// Delete Device Route (Protected, Admin Only)
app.delete('/devices/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const deletedDevice = await Device.findByIdAndDelete(req.params.id);
    
    if (!deletedDevice) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    res.json({ message: 'Device deleted successfully' });
  } catch (err) {
    console.error('Error deleting device:', err);
    res.status(500).json({ message: 'Server error deleting device' });
  }
});

// Students Route (Protected)
app.get('/students', isAuthenticated, async (req, res) => {
  try {
    // Fetch students from the database
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Server error fetching students' });
  }
});

// Get Single Student Route (Protected)
app.get('/students/:id', isAuthenticated, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (student) {
      res.json(student);
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ message: 'Server error fetching student' });
  }
});


// Create Student Route (Protected, Admin Only)
app.post('/students', isAuthenticated, isAdmin, async (req, res) => {
  console.log('Received POST /students request with body:', req.body);
  try {
    const newStudent = new Student(req.body);
    const savedStudent = await newStudent.save();
    res.status(201).json(savedStudent);
  } catch (err) {
    console.error('Error creating student:', err);
    if (err.name === 'ValidationError') {
      res.status(400).json({ message: 'Validation error', errors: err.errors });
    } else {
      res.status(500).json({ message: 'Server error creating student' });
    }
  }
});

// Update Student Route (Protected, Admin Only)
app.put('/students/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedStudent);
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ message: 'Server error updating student' });
  }
});

// Start the Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
