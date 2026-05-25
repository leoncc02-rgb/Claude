const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Course = require('../models/Course');

// Helper: compute gender stats from attendance records and students
const computeGenderStats = (records, students) => {
  const studentMap = {};
  students.forEach(s => { studentMap[s._id.toString()] = s; });

  let totalPresent = 0, totalAbsent = 0, totalLate = 0;
  let boysPresent = 0, boysAbsent = 0, boysLate = 0;
  let girlsPresent = 0, girlsAbsent = 0, girlsLate = 0;
  let totalBoys = 0, totalGirls = 0;

  students.forEach(s => {
    if (s.gender === 'M') totalBoys++;
    else if (s.gender === 'F') totalGirls++;
  });

  records.forEach(r => {
    const student = studentMap[r.studentId.toString()];
    const isBoy = student && student.gender === 'M';
    const isGirl = student && student.gender === 'F';

    if (r.status === 'presente') {
      totalPresent++;
      if (isBoy) boysPresent++;
      if (isGirl) girlsPresent++;
    } else if (r.status === 'ausente') {
      totalAbsent++;
      if (isBoy) boysAbsent++;
      if (isGirl) girlsAbsent++;
    } else if (r.status === 'tardanza') {
      totalLate++;
      if (isBoy) boysLate++;
      if (isGirl) girlsLate++;
    }
  });

  return {
    total: { present: totalPresent, absent: totalAbsent, late: totalLate, students: students.length },
    boys: { present: boysPresent, absent: boysAbsent, late: boysLate, total: totalBoys },
    girls: { present: girlsPresent, absent: girlsAbsent, late: girlsLate, total: totalGirls }
  };
};

// GET /api/attendance?courseId=&date=
exports.getAttendance = async (req, res) => {
  try {
    const { courseId, date } = req.query;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Se requiere courseId' });
    }

    // Verify teacher owns course
    const course = await Course.findOne({ _id: courseId, teacherId: req.userId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    }

    // Get students in course
    const students = await Student.find({
      courses: courseId,
      isActive: true,
      teacherId: req.userId
    }).sort({ seatNumber: 1, lastName: 1, firstName: 1 });

    if (!date) {
      // Return list of dates that have attendance records
      const records = await Attendance.find({ courseId, teacherId: req.userId })
        .select('date')
        .sort({ date: -1 });
      return res.json({ success: true, data: { dates: records.map(r => r.date), students } });
    }

    // Parse date (normalize to start of day)
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    let attendance = await Attendance.findOne({
      courseId,
      teacherId: req.userId,
      date: { $gte: targetDate, $lt: nextDay }
    });

    // If no attendance record exists, create a template with all students as "presente"
    let records = [];
    if (attendance) {
      records = attendance.records;
      // Add any students not in the record (newly added students)
      const recordedStudentIds = records.map(r => r.studentId.toString());
      students.forEach(student => {
        if (!recordedStudentIds.includes(student._id.toString())) {
          records.push({ studentId: student._id, status: 'presente', justification: '' });
        }
      });
    } else {
      // Template: all students present
      records = students.map(s => ({
        studentId: s._id,
        status: 'presente',
        justification: ''
      }));
    }

    const stats = computeGenderStats(records, students);

    res.json({
      success: true,
      data: {
        attendance: attendance || null,
        date: targetDate,
        records,
        students,
        stats
      }
    });
  } catch (error) {
    console.error('Error obteniendo asistencia:', error);
    res.status(500).json({ success: false, message: 'Error al obtener asistencia' });
  }
};

// POST or PUT /api/attendance - create or update attendance for a date
exports.saveAttendance = async (req, res) => {
  try {
    const { courseId, date, records, notes } = req.body;

    if (!courseId || !date || !records) {
      return res.status(400).json({ success: false, message: 'courseId, date y records son obligatorios' });
    }

    // Verify teacher owns course
    const course = await Course.findOne({ _id: courseId, teacherId: req.userId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    }

    // Normalize date
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    // Validate records
    const validStatuses = ['presente', 'ausente', 'tardanza'];
    for (const record of records) {
      if (!record.studentId) {
        return res.status(400).json({ success: false, message: 'studentId es requerido en cada registro' });
      }
      if (!validStatuses.includes(record.status)) {
        return res.status(400).json({
          success: false,
          message: `Estado inválido: ${record.status}. Valores: presente, ausente, tardanza`
        });
      }
    }

    // Get students for stats
    const students = await Student.find({
      courses: courseId,
      isActive: true,
      teacherId: req.userId
    });

    const attendance = await Attendance.findOneAndUpdate(
      {
        courseId,
        teacherId: req.userId,
        date: { $gte: targetDate, $lt: nextDay }
      },
      {
        courseId,
        date: targetDate,
        records,
        notes: notes || '',
        teacherId: req.userId
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const stats = computeGenderStats(records, students);

    res.json({
      success: true,
      message: 'Asistencia guardada correctamente',
      data: { attendance, stats }
    });
  } catch (error) {
    console.error('Error guardando asistencia:', error);
    res.status(500).json({ success: false, message: 'Error al guardar asistencia' });
  }
};

// GET /api/attendance/dates?courseId= - list all dates with attendance
exports.getAttendanceDates = async (req, res) => {
  try {
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Se requiere courseId' });
    }

    const course = await Course.findOne({ _id: courseId, teacherId: req.userId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    }

    const records = await Attendance.find({ courseId, teacherId: req.userId })
      .select('date notes')
      .sort({ date: -1 });

    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Error obteniendo fechas de asistencia:', error);
    res.status(500).json({ success: false, message: 'Error al obtener fechas' });
  }
};

// GET /api/attendance/student/:studentId?courseId= - attendance history for a student
exports.getStudentAttendance = async (req, res) => {
  try {
    const { courseId } = req.query;
    const { studentId } = req.params;

    const student = await Student.findOne({ _id: studentId, teacherId: req.userId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    }

    const filter = { teacherId: req.userId, 'records.studentId': studentId };
    if (courseId) filter.courseId = courseId;

    const attendances = await Attendance.find(filter).sort({ date: -1 });

    const history = attendances.map(att => {
      const record = att.records.find(r => r.studentId.toString() === studentId);
      return {
        date: att.date,
        courseId: att.courseId,
        status: record ? record.status : null,
        justification: record ? record.justification : ''
      };
    });

    const stats = {
      total: history.length,
      presente: history.filter(h => h.status === 'presente').length,
      ausente: history.filter(h => h.status === 'ausente').length,
      tardanza: history.filter(h => h.status === 'tardanza').length
    };

    res.json({ success: true, data: { history, stats } });
  } catch (error) {
    console.error('Error obteniendo asistencia del estudiante:', error);
    res.status(500).json({ success: false, message: 'Error al obtener historial de asistencia' });
  }
};
