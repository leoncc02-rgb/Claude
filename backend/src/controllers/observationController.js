const Observation = require('../models/Observation');
const Course = require('../models/Course');
const Student = require('../models/Student');

// GET /api/observations?courseId=&studentId=&type=&limit=
exports.getObservations = async (req, res) => {
  try {
    const { courseId, studentId, type, limit = 50, page = 1 } = req.query;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Se requiere courseId' });
    }

    // Verify teacher owns course
    const course = await Course.findOne({ _id: courseId, teacherId: req.userId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    }

    const filter = { courseId, teacherId: req.userId };
    if (studentId) filter.studentId = studentId;
    if (type) filter.type = type;

    const total = await Observation.countDocuments(filter);
    const observations = await Observation.find(filter)
      .populate('studentId', 'firstName lastName photo gender seatNumber')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: {
        observations,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error obteniendo observaciones:', error);
    res.status(500).json({ success: false, message: 'Error al obtener observaciones' });
  }
};

// GET /api/observations/:id
exports.getObservation = async (req, res) => {
  try {
    const observation = await Observation.findOne({ _id: req.params.id, teacherId: req.userId })
      .populate('studentId', 'firstName lastName photo gender seatNumber');

    if (!observation) {
      return res.status(404).json({ success: false, message: 'Observación no encontrada' });
    }

    res.json({ success: true, data: observation });
  } catch (error) {
    console.error('Error obteniendo observación:', error);
    res.status(500).json({ success: false, message: 'Error al obtener observación' });
  }
};

// POST /api/observations
exports.createObservation = async (req, res) => {
  try {
    const { courseId, studentId, type, content, isPrivate, isPinned, dueDate } = req.body;

    if (!courseId || !content) {
      return res.status(400).json({ success: false, message: 'courseId y content son obligatorios' });
    }

    // Verify teacher owns course
    const course = await Course.findOne({ _id: courseId, teacherId: req.userId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    }

    // If studentId provided, verify it belongs to teacher
    if (studentId) {
      const student = await Student.findOne({ _id: studentId, teacherId: req.userId });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
      }
    }

    const observation = new Observation({
      courseId,
      studentId: studentId || null,
      type: type || 'general',
      content,
      isPrivate: isPrivate || false,
      isPinned: isPinned || false,
      dueDate: dueDate || null,
      teacherId: req.userId
    });

    await observation.save();
    await observation.populate('studentId', 'firstName lastName photo gender seatNumber');

    res.status(201).json({
      success: true,
      message: 'Observación creada correctamente',
      data: observation
    });
  } catch (error) {
    console.error('Error creando observación:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Error al crear observación' });
  }
};

// PUT /api/observations/:id
exports.updateObservation = async (req, res) => {
  try {
    const { type, content, isPrivate, isPinned, isResolved, dueDate, studentId } = req.body;

    const observation = await Observation.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.userId },
      { type, content, isPrivate, isPinned, isResolved, dueDate, studentId: studentId || null },
      { new: true, runValidators: true }
    );

    if (!observation) {
      return res.status(404).json({ success: false, message: 'Observación no encontrada' });
    }

    await observation.populate('studentId', 'firstName lastName photo gender seatNumber');

    res.json({ success: true, message: 'Observación actualizada', data: observation });
  } catch (error) {
    console.error('Error actualizando observación:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Error al actualizar observación' });
  }
};

// DELETE /api/observations/:id
exports.deleteObservation = async (req, res) => {
  try {
    const observation = await Observation.findOneAndDelete({ _id: req.params.id, teacherId: req.userId });
    if (!observation) {
      return res.status(404).json({ success: false, message: 'Observación no encontrada' });
    }
    res.json({ success: true, message: 'Observación eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando observación:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar observación' });
  }
};

// PATCH /api/observations/:id/resolve - toggle resolved status
exports.toggleResolved = async (req, res) => {
  try {
    const observation = await Observation.findOne({ _id: req.params.id, teacherId: req.userId });
    if (!observation) {
      return res.status(404).json({ success: false, message: 'Observación no encontrada' });
    }

    observation.isResolved = !observation.isResolved;
    await observation.save();

    res.json({ success: true, message: 'Estado actualizado', data: observation });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar estado' });
  }
};
