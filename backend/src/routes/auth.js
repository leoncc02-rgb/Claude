const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword
} = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me
router.get('/me', auth, getCurrentUser);

// PUT /api/auth/profile
router.put('/profile', auth, updateProfile);

// PUT /api/auth/password
router.put('/password', auth, changePassword);

module.exports = router;
