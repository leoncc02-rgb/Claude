import client from './client';

export const gradesApi = {
  getAll: (params = {}) => client.get('/grades', { params }),
  upsert: (data) => client.post('/grades', data),
  bulkUpsert: (grades) => client.post('/grades/bulk', { grades }),
  delete: (id) => client.delete(`/grades/${id}`)
};
