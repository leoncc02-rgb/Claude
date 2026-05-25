const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getGrades,
  upsertGrade,
  bulkUpsertGrades,
  deleteGrade
} = require('../controllers/gradeController');

router.use(auth);

// GET /api/grades?courseId=&subject=&studentId=
router.get('/', getGrades);

// POST /api/grades (upsert single grade)
router.post('/', upsertGrade);

// POST /api/grades/bulk (upsert multiple grades)
router.post('/bulk', bulkUpsertGrades);

// DELETE /api/grades/:id
router.delete('/:id', deleteGrade);

module.exports = router;
