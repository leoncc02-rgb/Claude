const request = require('supertest');
const app = require('../index');
const Feedback = require('../models/Feedback');
const { generateToken } = require('../middleware/auth');

jest.mock('../models/Feedback');

const TEACHER_ID = '64b1234567890abcdef00001';
const ADMIN_ID = '64b1234567890abcdef00002';
const teacherToken = generateToken(TEACHER_ID, 'teacher');
const adminToken = generateToken(ADMIN_ID, 'admin');

beforeEach(() => {
  jest.clearAllMocks();
  Feedback.find = jest.fn();
});

describe('POST /api/feedback', () => {
  it('envía un comentario correctamente', async () => {
    const savedFeedback = {
      _id: '64b1234567890abcdef00010',
      userId: TEACHER_ID,
      mensaje: 'Excelente sistema',
      tipo: 'sugerencia'
    };
    Feedback.mockImplementation(() => ({
      ...savedFeedback,
      save: jest.fn().mockResolvedValue(savedFeedback)
    }));

    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ mensaje: 'Excelente sistema', tipo: 'sugerencia' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.feedback.mensaje).toBe('Excelente sistema');
    expect(Feedback).toHaveBeenCalledWith({
      userId: TEACHER_ID,
      mensaje: 'Excelente sistema',
      tipo: 'sugerencia'
    });
  });

  it('rechaza la solicitud sin token de autenticación', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({ mensaje: 'Sin token' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(Feedback).not.toHaveBeenCalled();
  });

  it('devuelve 400 cuando el modelo lanza ValidationError', async () => {
    const validationError = Object.assign(new Error('Validation failed'), {
      name: 'ValidationError',
      errors: { mensaje: { message: 'El mensaje es requerido' } }
    });
    Feedback.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(validationError)
    }));

    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ tipo: 'error' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/requerido/i);
  });

  it('devuelve 500 ante un error inesperado del servidor', async () => {
    Feedback.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(new Error('DB caída'))
    }));

    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ mensaje: 'Comentario' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/feedback', () => {
  it('permite a un admin obtener todos los comentarios', async () => {
    const mockFeedbacks = [
      { _id: 'fb1', userId: { name: 'Profesor', email: 'prof@test.com' }, mensaje: 'Bueno', tipo: 'general' },
      { _id: 'fb2', userId: { name: 'Otro', email: 'otro@test.com' }, mensaje: 'Excelente', tipo: 'sugerencia' }
    ];
    const sortMock = jest.fn().mockResolvedValue(mockFeedbacks);
    Feedback.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ sort: sortMock })
    });

    const res = await request(app)
      .get('/api/feedback')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.feedbacks).toHaveLength(2);
    expect(Feedback.find).toHaveBeenCalled();
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('deniega el acceso a un teacher', async () => {
    const res = await request(app)
      .get('/api/feedback')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Acceso denegado');
    expect(Feedback.find).not.toHaveBeenCalled();
  });

  it('rechaza la solicitud sin token de autenticación', async () => {
    const res = await request(app).get('/api/feedback');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(Feedback.find).not.toHaveBeenCalled();
  });
});
