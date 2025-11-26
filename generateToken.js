// utils/generateToken.js
const jwt = require('jsonwebtoken');

// Ensure you set a secret in your .env file
// .env: JWT_SECRET=your_strong_secret_key
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

module.exports = generateToken;