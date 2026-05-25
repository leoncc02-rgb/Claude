const Course = require('../models/Course');
const Student = require('../models/Student');

// Get all courses for the teacher
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ teacherId: req.userId, isActive: true })
      .sort({ year: -1, name: 1 });

    // Add student count to each course
    const coursesWithCounts = await Promise.all(courses.map(async (course) => {
      const studentCount = await Student.countDocuments({
        courses: course._id,
        isActive: true
      });
      return { ...course.toObject(), studentCount };
    }));

    res.json({ success: true, data: coursesWithCounts });
  } catch (error) {
    console.error('Error obteniendo cursos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener cursos' });
  }
};

// Get single course
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, teacherId: req.userId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    }
    const studentCount = await Student.countDocuments({ courses: course._id, isActive: true });
    res.json({ success: true, data: { ...course.toObject(), studentCount } });
  } catch (error) {
    console.error('Error obteniendo curso:', error);
    res.status(500).json({ success: false, message: 'Error al obtener curso' });
  }
};

// Create course
exports.createCourse = async (req, res) => {
  try {
    const { name, grade, section, period, year, description, color } = req.body;

    const course = new Course({
      name,
      grade,
      section: section || '',
      period: period || '',
      year: year || new Date().getFullYear(),
      description: description || '',
      color: color || '#4F46E5',
      teacherId: req.userId
    });

    await course.save();
    res.status(201).json({
      success: true,
      message: 'Curso creado correctamente',
      data: { ...course.toObject(), studentCount: 0 }
    });
  } catch (error) {
    console.error('Error creando curso:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Error al crear curso' });
  }
};

// Update course
exports.updateCourse = async (req, res) => {
  try {
    const { name, grade, section, period, year, description, color, isActive } = req.body;

    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.userId },
      { name, grade, section, period, year, description, color, isActive },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    }

    res.json({ success: true, message: 'Curso actualizado', data: course });
  } catch (error) {
    console.error('Error actualizando curso:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Error al actualizar curso' });
  }
};

// Delete course (soft delete)
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.userId },
      { isActive: false },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    }

    res.json({ success: true, message: 'Curso eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando curso:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar curso' });
  }
};

// Get students in a course
exports.getCourseStudents = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, teacherId: req.userId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    }

    const students = await Student.find({
      courses: course._id,
      isActive: true
    }).sort({ seatNumber: 1, lastName: 1, firstName: 1 });

    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Error obteniendo estudiantes del curso:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estudiantes' });
  }
};
