const Student = require('../models/Student');
const Course = require('../models/Course');

// Get all students for teacher (optionally filtered by course)
exports.getStudents = async (req, res) => {
  try {
    const { courseId, search, gender } = req.query;
    const filter = { teacherId: req.userId, isActive: true };

    if (courseId) {
      // Verify teacher owns the course
      const course = await Course.findOne({ _id: courseId, teacherId: req.userId });
      if (!course) {
        return res.status(404).json({ success: false, message: 'Curso no encontrado' });
      }
      filter.courses = courseId;
    }

    if (gender && ['M', 'F'].includes(gender)) {
      filter.gender = gender;
    }

    let query = Student.find(filter).sort({ seatNumber: 1, lastName: 1, firstName: 1 });

    const students = await query;

    // Apply search filter (in memory for simplicity)
    let result = students;
    if (search) {
      const searchLower = search.toLowerCase();
      result = students.filter(s =>
        s.firstName.toLowerCase().includes(searchLower) ||
        s.lastName.toLowerCase().includes(searchLower) ||
        (s.email && s.email.toLowerCase().includes(searchLower))
      );
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error obteniendo estudiantes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estudiantes' });
  }
};

// Get single student
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      teacherId: req.userId
    }).populate('courses', 'name grade section');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    }

    res.json({ success: true, data: student });
  } catch (error) {
    console.error('Error obteniendo estudiante:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estudiante' });
  }
};

// Create student
exports.createStudent = async (req, res) => {
  try {
    const {
      firstName, lastName, gender, photo, seatNumber,
      dateOfBirth, email, phone, parentName, parentPhone, address, notes, courseId
    } = req.body;

    const student = new Student({
      firstName,
      lastName,
      gender,
      photo: photo || null,
      seatNumber: seatNumber || null,
      dateOfBirth: dateOfBirth || null,
      email: email || '',
      phone: phone || '',
      parentName: parentName || '',
      parentPhone: parentPhone || '',
      address: address || '',
      notes: notes || '',
      teacherId: req.userId
    });

    if (courseId) {
      // Verify teacher owns course
      const course = await Course.findOne({ _id: courseId, teacherId: req.userId });
      if (!course) {
        return res.status(404).json({ success: false, message: 'Curso no encontrado' });
      }
      student.courses = [courseId];
    }

    await student.save();

    res.status(201).json({
      success: true,
      message: 'Estudiante creado correctamente',
      data: student
    });
  } catch (error) {
    console.error('Error creando estudiante:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Error al crear estudiante' });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const {
      firstName, lastName, gender, photo, seatNumber,
      dateOfBirth, email, phone, parentName, parentPhone, address, notes, isActive
    } = req.body;

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.userId },
      {
        firstName, lastName, gender, photo, seatNumber,
        dateOfBirth, email, phone, parentName, parentPhone, address, notes, isActive
      },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    }

    res.json({ success: true, message: 'Estudiante actualizado', data: student });
  } catch (error) {
    console.error('Error actualizando estudiante:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Error al actualizar estudiante' });
  }
};

// Update student photo
exports.updatePhoto = async (req, res) => {
  try {
    const { photo } = req.body;

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.userId },
      { photo },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    }

    res.json({ success: true, message: 'Foto actualizada', data: { photo: student.photo } });
  } catch (error) {
    console.error('Error actualizando foto:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar foto' });
  }
};

// Delete student (soft delete)
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.userId },
      { isActive: false },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    }

    res.json({ success: true, message: 'Estudiante eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando estudiante:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar estudiante' });
  }
};

// Add student to course
exports.addToCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findOne({ _id: courseId, teacherId: req.userId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    }

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.userId },
      { $addToSet: { courses: courseId } },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    }

    res.json({ success: true, message: 'Estudiante añadido al curso', data: student });
  } catch (error) {
    console.error('Error añadiendo estudiante a curso:', error);
    res.status(500).json({ success: false, message: 'Error al añadir estudiante al curso' });
  }
};

// Remove student from course
exports.removeFromCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.userId },
      { $pull: { courses: courseId } },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    }

    res.json({ success: true, message: 'Estudiante removido del curso', data: student });
  } catch (error) {
    console.error('Error removiendo estudiante del curso:', error);
    res.status(500).json({ success: false, message: 'Error al remover estudiante del curso' });
  }
};
