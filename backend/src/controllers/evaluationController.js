const Evaluation = require('../models/Evaluation');
const Course = require('../models/Course');
const Grade = require('../models/Grade');

// Get evaluations for a course (optionally filtered by subject)
exports.getEvaluations = async (req, res) => {
  try {
    const { courseId, subject } = req.query;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Se requiere courseId' });
    }

    // Verify teacher owns course
    const course = await Course.findOne({ _id: courseId, teacherId: req.userId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    }

    const filter = { courseId, teacherId: req.userId };
    if (subject) filter.subject = subject;

    const evaluations = await Evaluation.find(filter).sort({ subject: 1, order: 1, createdAt: 1 });

    res.json({ success: true, data: evaluations });
  } catch (error) {
    console.error('Error obteniendo evaluaciones:', error);
    res.status(500).json({ success: false, message: 'Error al obtener evaluaciones' });
  }
};

// Get single evaluation
exports.getEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findOne({ _id: req.params.id, teacherId: req.userId });
    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Evaluación no encontrada' });
    }
    res.json({ success: true, data: evaluation });
  } catch (error) {
    console.error('Error obteniendo evaluación:', error);
    res.status(500).json({ success: false, message: 'Error al obtener evaluación' });
  }
};

// Create evaluation
exports.createEvaluation = async (req, res) => {
  try {
    const { name, type, subject, weight, maxScore, dueDate, description, courseId, order } = req.body;

    // Verify teacher owns course
    const course = await Course.findOne({ _id: courseId, teacherId: req.userId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    }

    const evaluation = new Evaluation({
      name,
      type: type || 'otro',
      subject,
      weight: weight || 10,
      maxScore: maxScore || 20,
      dueDate: dueDate || null,
      description: description || '',
      courseId,
      teacherId: req.userId,
      order: order || 0
    });

    await evaluation.save();

    res.status(201).json({
      success: true,
      message: 'Evaluación creada correctamente',
      data: evaluation
    });
  } catch (error) {
    console.error('Error creando evaluación:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Error al crear evaluación' });
  }
};

// Update evaluation (name, weight, type are all editable)
exports.updateEvaluation = async (req, res) => {
  try {
    const { name, type, subject, weight, maxScore, dueDate, description, order } = req.body;

    const evaluation = await Evaluation.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.userId },
      { name, type, subject, weight, maxScore, dueDate, description, order },
      { new: true, runValidators: true }
    );

    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Evaluación no encontrada' });
    }

    res.json({ success: true, message: 'Evaluación actualizada', data: evaluation });
  } catch (error) {
    console.error('Error actualizando evaluación:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Error al actualizar evaluación' });
  }
};

// Delete evaluation (also deletes associated grades)
exports.deleteEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findOne({ _id: req.params.id, teacherId: req.userId });
    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Evaluación no encontrada' });
    }

    // Delete associated grades first
    await Grade.deleteMany({ evaluationId: req.params.id });

    // Delete evaluation
    await Evaluation.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Evaluación eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando evaluación:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar evaluación' });
  }
};
