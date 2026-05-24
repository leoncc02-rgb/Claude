const express = require('express');
const router = express.Router();
const { enviarComentario, obtenerComentarios } = require('../controllers/feedbackController');
const { auth } = require('../middleware/auth');

router.post('/', auth, enviarComentario);
router.get('/', auth, obtenerComentarios);

module.exports = router;
