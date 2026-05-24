const Feedback = require('../models/Feedback');

exports.enviarComentario = async (req, res) => {
  try {
    const { mensaje, tipo } = req.body;

    const feedback = new Feedback({ userId: req.userId, mensaje, tipo });
    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Comentario enviado correctamente',
      feedback
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', ')
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al enviar comentario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.obtenerComentarios = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Acceso denegado' });
    }

    const feedbacks = await Feedback.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, feedbacks });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener comentarios',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
