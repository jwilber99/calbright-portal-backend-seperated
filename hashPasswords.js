// hashPasswords.js

const bcrypt = require('bcryptjs');

async function hashPasswords() {
  try {
    // Replace 'adminpassword' and 'userpassword' with your desired passwords
    const adminPlainPassword = 'adminpassword';
    const userPlainPassword = 'userpassword';

    // Hash the passwords
    const adminPasswordHash = await bcrypt.hash(adminPlainPassword, 10);
    const userPasswordHash = await bcrypt.hash(userPlainPassword, 10);

    // Output the hashed passwords
    console.log('Admin Password Hash:', adminPasswordHash);
    console.log('User Password Hash:', userPasswordHash);
  } catch (error) {
    console.error('Error hashing passwords:', error);
  }
}

hashPasswords();
