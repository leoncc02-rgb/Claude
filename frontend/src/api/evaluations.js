import client from './client';

export const evaluationsApi = {
  getAll: (params = {}) => client.get('/evaluations', { params }),
  getOne: (id) => client.get(`/evaluations/${id}`),
  create: (data) => client.post('/evaluations', data),
  update: (id, data) => client.put(`/evaluations/${id}`, data),
  delete: (id) => client.delete(`/evaluations/${id}`)
};
