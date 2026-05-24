const express = require('express');
const router = express.Router();
const {
  registrarAsistencia,
  obtenerAsistencia,
  reporteEstudiante,
  actualizarAsistencia
} = require('../controllers/attendanceController');
const { auth } = require('../middleware/auth');

// /reporte/:studentId debe ir antes de /:id para evitar conflictos de matching
router.get('/reporte/:studentId', auth, reporteEstudiante);
router.get('/', auth, obtenerAsistencia);
router.post('/', auth, registrarAsistencia);
router.put('/:id', auth, actualizarAsistencia);

module.exports = router;
