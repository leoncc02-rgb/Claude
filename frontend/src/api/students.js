import client from './client';

export const studentsApi = {
  getAll: (params = {}) => client.get('/students', { params }),
  getOne: (id) => client.get(`/students/${id}`),
  create: (data) => client.post('/students', data),
  update: (id, data) => client.put(`/students/${id}`, data),
  updatePhoto: (id, photo) => client.put(`/students/${id}/photo`, { photo }),
  delete: (id) => client.delete(`/students/${id}`),
  addToCourse: (id, courseId) => client.post(`/students/${id}/courses`, { courseId }),
  removeFromCourse: (id, courseId) => client.delete(`/students/${id}/courses/${courseId}`)
};
