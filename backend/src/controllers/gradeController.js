const Grade = require('../models/Grade');
const Evaluation = require('../models/Evaluation');
const Student = require('../models/Student');
const Course = require('../models/Course');

// GET /api/grades?courseId=&subject=&studentId=
exports.getGrades = async (req, res) => {
  try {
    const { courseId, subject, studentId } = req.query;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Se requiere courseId' });
    }

    // Verify teacher owns course
    const course = await Course.findOne({ _id: courseId, teacherId: req.userId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    }

    // Get evaluations for this course (optionally filtered by subject)
    const evalFilter = { courseId, teacherId: req.userId };
    if (subject) evalFilter.subject = subject;
    const evaluations = await Evaluation.find(evalFilter).sort({ subject: 1, order: 1, createdAt: 1 });
    const evaluationIds = evaluations.map(e => e._id);

    // Get students in this course
    const studentFilter = { courses: courseId, teacherId: req.userId, isActive: true };
    if (studentId) studentFilter._id = studentId;
    const students = await Student.find(studentFilter).sort({ seatNumber: 1, lastName: 1, firstName: 1 });
    const studentIds = students.map(s => s._id);

    // Get all grades for these students and evaluations
    const grades = await Grade.find({
      courseId,
      evaluationId: { $in: evaluationIds },
      studentId: { $in: studentIds }
    });

    // Build a lookup map: grades[studentId][evaluationId] = grade
    const gradesMap = {};
    grades.forEach(grade => {
      const sid = grade.studentId.toString();
      const eid = grade.evaluationId.toString();
      if (!gradesMap[sid]) gradesMap[sid] = {};
      gradesMap[sid][eid] = grade;
    });

    // Compute weighted averages per student per subject
    const tecnologiaEvals = evaluations.filter(e => e.subject === 'tecnologia');
    const informaticaEvals = evaluations.filter(e => e.subject === 'informatica');

    const computeAverage = (studentId, evals) => {
      const sid = studentId.toString();
      const gradedEvals = evals.filter(e => {
        const eid = e._id.toString();
        return gradesMap[sid] && gradesMap[sid][eid] && gradesMap[sid][eid].score !== null;
      });
      if (gradedEvals.length === 0) return null;
      const totalWeight = gradedEvals.reduce((acc, e) => acc + e.weight, 0);
      if (totalWeight === 0) return null;
      const weightedSum = gradedEvals.reduce((acc, e) => {
        const eid = e._id.toString();
        const score = gradesMap[sid][eid].score;
        const normalized = (score / e.maxScore) * 20; // normalize to 20 scale
        return acc + normalized * e.weight;
      }, 0);
      return parseFloat((weightedSum / totalWeight).toFixed(2));
    };

    const result = students.map(student => {
      const sid = student._id.toString();
      const studentGrades = {};
      evaluations.forEach(ev => {
        const eid = ev._id.toString();
        studentGrades[eid] = (gradesMap[sid] && gradesMap[sid][eid]) || null;
      });

      return {
        student,
        grades: studentGrades,
        averages: {
          tecnologia: computeAverage(student._id, tecnologiaEvals),
          informatica: computeAverage(student._id, informaticaEvals)
        }
      };
    });

    // Compute class stats per evaluation
    const evalStats = {};
    evaluations.forEach(ev => {
      const eid = ev._id.toString();
      const scores = students
        .map(s => gradesMap[s._id.toString()]?.[eid]?.score)
        .filter(s => s !== null && s !== undefined);
      evalStats[eid] = {
        count: scores.length,
        avg: scores.length > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : null,
        max: scores.length > 0 ? Math.max(...scores) : null,
        min: scores.length > 0 ? Math.min(...scores) : null
      };
    });

    res.json({
      success: true,
      data: {
        evaluations,
        studentGrades: result,
        evalStats
      }
    });
  } catch (error) {
    console.error('Error obteniendo calificaciones:', error);
    res.status(500).json({ success: false, message: 'Error al obtener calificaciones' });
  }
};

// POST /api/grades - upsert a grade
exports.upsertGrade = async (req, res) => {
  try {
    const { studentId, evaluationId, courseId, score, comment } = req.body;

    // Verify evaluation belongs to teacher
    const evaluation = await Evaluation.findOne({ _id: evaluationId, teacherId: req.userId });
    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Evaluación no encontrada' });
    }

    // Verify student belongs to teacher
    const student = await Student.findOne({ _id: studentId, teacherId: req.userId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    }

    // Validate score range
    if (score !== null && score !== undefined && (score < 0 || score > evaluation.maxScore)) {
      return res.status(400).json({
        success: false,
        message: `La nota debe estar entre 0 y ${evaluation.maxScore}`
      });
    }

    const grade = await Grade.findOneAndUpdate(
      { studentId, evaluationId },
      {
        studentId,
        evaluationId,
        courseId: courseId || evaluation.courseId,
        score: score !== undefined ? score : null,
        comment: comment || '',
        teacherId: req.userId
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: 'Calificación guardada', data: grade });
  } catch (error) {
    console.error('Error guardando calificación:', error);
    res.status(500).json({ success: false, message: 'Error al guardar calificación' });
  }
};

// POST /api/grades/bulk - upsert multiple grades at once
exports.bulkUpsertGrades = async (req, res) => {
  try {
    const { grades } = req.body; // Array of { studentId, evaluationId, courseId, score, comment }

    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({ success: false, message: 'Se requiere un array de calificaciones' });
    }

    const results = await Promise.all(grades.map(async ({ studentId, evaluationId, courseId, score, comment }) => {
      const evaluation = await Evaluation.findOne({ _id: evaluationId, teacherId: req.userId });
      if (!evaluation) return null;

      return Grade.findOneAndUpdate(
        { studentId, evaluationId },
        {
          studentId,
          evaluationId,
          courseId: courseId || evaluation.courseId,
          score: score !== undefined ? score : null,
          comment: comment || '',
          teacherId: req.userId
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }));

    res.json({ success: true, message: 'Calificaciones guardadas', data: results.filter(Boolean) });
  } catch (error) {
    console.error('Error guardando calificaciones en bulk:', error);
    res.status(500).json({ success: false, message: 'Error al guardar calificaciones' });
  }
};

// DELETE /api/grades/:id
exports.deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findOneAndDelete({ _id: req.params.id, teacherId: req.userId });
    if (!grade) {
      return res.status(404).json({ success: false, message: 'Calificación no encontrada' });
    }
    res.json({ success: true, message: 'Calificación eliminada' });
  } catch (error) {
    console.error('Error eliminando calificación:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar calificación' });
  }
};
