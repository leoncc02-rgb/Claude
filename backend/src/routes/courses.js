const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseStudents
} = require('../controllers/courseController');

// All routes require authentication
router.use(auth);

// GET /api/courses
router.get('/', getCourses);

// GET /api/courses/:id
router.get('/:id', getCourse);

// POST /api/courses
router.post('/', createCourse);

// PUT /api/courses/:id
router.put('/:id', updateCourse);

// DELETE /api/courses/:id
router.delete('/:id', deleteCourse);

// GET /api/courses/:id/students
router.get('/:id/students', getCourseStudents);

module.exports = router;
