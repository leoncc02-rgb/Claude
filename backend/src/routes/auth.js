const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/registro', register);
router.post('/login', login);
router.get('/me', auth, getCurrentUser);
router.put('/perfil', auth, updateProfile);
router.put('/cambiar-password', auth, changePassword);

module.exports = router;
