const express = require('express');
const router = express.Router();
const {
  listarEstudiantes,
  crearEstudiante,
  obtenerEstudiante,
  actualizarEstudiante,
  eliminarEstudiante
} = require('../controllers/studentsController');
const { auth } = require('../middleware/auth');

router.get('/', auth, listarEstudiantes);
router.post('/', auth, crearEstudiante);
router.get('/:id', auth, obtenerEstudiante);
router.put('/:id', auth, actualizarEstudiante);
router.delete('/:id', auth, eliminarEstudiante);

module.exports = router;
