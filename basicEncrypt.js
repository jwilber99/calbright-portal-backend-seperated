// hashPassword.js

const bcrypt = require('bcryptjs');

// Replace 'YourPasswordHere' with the password you want to hash
const password = 'Passingw0rds';

bcrypt.hash(password, 10, function (err, hash) {
  if (err) {
    console.error('Error hashing password:', err);
  } else {
    console.log('Hashed password:', hash);
  }
});
