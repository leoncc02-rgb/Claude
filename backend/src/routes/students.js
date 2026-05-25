const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  updatePhoto,
  deleteStudent,
  addToCourse,
  removeFromCourse
} = require('../controllers/studentController');

router.use(auth);

// GET /api/students?courseId=&search=&gender=
router.get('/', getStudents);

// GET /api/students/:id
router.get('/:id', getStudent);

// POST /api/students
router.post('/', createStudent);

// PUT /api/students/:id
router.put('/:id', updateStudent);

// PUT /api/students/:id/photo
router.put('/:id/photo', updatePhoto);

// DELETE /api/students/:id
router.delete('/:id', deleteStudent);

// POST /api/students/:id/courses - add to course
router.post('/:id/courses', addToCourse);

// DELETE /api/students/:id/courses/:courseId - remove from course
router.delete('/:id/courses/:courseId', removeFromCourse);

module.exports = router;
