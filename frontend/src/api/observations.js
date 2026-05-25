import client from './client';

export const observationsApi = {
  getAll: (params = {}) => client.get('/observations', { params }),
  getOne: (id) => client.get(`/observations/${id}`),
  create: (data) => client.post('/observations', data),
  update: (id, data) => client.put(`/observations/${id}`, data),
  delete: (id) => client.delete(`/observations/${id}`),
  toggleResolved: (id) => client.patch(`/observations/${id}/resolve`)
};
