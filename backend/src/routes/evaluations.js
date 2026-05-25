const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getEvaluations,
  getEvaluation,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation
} = require('../controllers/evaluationController');

router.use(auth);

// GET /api/evaluations?courseId=&subject=
router.get('/', getEvaluations);

// GET /api/evaluations/:id
router.get('/:id', getEvaluation);

// POST /api/evaluations
router.post('/', createEvaluation);

// PUT /api/evaluations/:id (editable name, weight, type)
router.put('/:id', updateEvaluation);

// DELETE /api/evaluations/:id
router.delete('/:id', deleteEvaluation);

module.exports = router;
