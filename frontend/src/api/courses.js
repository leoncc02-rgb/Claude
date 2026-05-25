import client from './client';

export const coursesApi = {
  getAll: () => client.get('/courses'),
  getOne: (id) => client.get(`/courses/${id}`),
  create: (data) => client.post('/courses', data),
  update: (id, data) => client.put(`/courses/${id}`, data),
  delete: (id) => client.delete(`/courses/${id}`),
  getStudents: (id) => client.get(`/courses/${id}/students`)
};
