const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getAttendance,
  saveAttendance,
  getAttendanceDates,
  getStudentAttendance
} = require('../controllers/attendanceController');

router.use(auth);

// GET /api/attendance?courseId=&date=
router.get('/', getAttendance);

// POST /api/attendance (create or update)
router.post('/', saveAttendance);

// PUT /api/attendance (same as POST, upsert for any date)
router.put('/', saveAttendance);

// GET /api/attendance/dates?courseId=
router.get('/dates', getAttendanceDates);

// GET /api/attendance/student/:studentId?courseId=
router.get('/student/:studentId', getStudentAttendance);

module.exports = router;
