const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getObservations,
  getObservation,
  createObservation,
  updateObservation,
  deleteObservation,
  toggleResolved
} = require('../controllers/observationController');

router.use(auth);

// GET /api/observations?courseId=&studentId=&type=
router.get('/', getObservations);

// GET /api/observations/:id
router.get('/:id', getObservation);

// POST /api/observations
router.post('/', createObservation);

// PUT /api/observations/:id
router.put('/:id', updateObservation);

// DELETE /api/observations/:id
router.delete('/:id', deleteObservation);

// PATCH /api/observations/:id/resolve
router.patch('/:id/resolve', toggleResolved);

module.exports = router;
