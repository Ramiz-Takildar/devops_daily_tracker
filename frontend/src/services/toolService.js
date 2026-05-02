import api from './api';

export const toolService = {
  async getAllTools() {
    const response = await api.get('/tools');
    return response.data.tools;
  },

  async getEntries(params = {}) {
    const response = await api.get('/tools/entries', { params });
    return response.data;
  },

  async getEntriesByDate(date) {
    const response = await api.get(`/tools/entries/date/${date}`);
    return response.data.entries;
  },

  async createEntry(data) {
    const response = await api.post('/tools/entries', data);
    return response.data;
  },

  async updateEntry(id, data) {
    const response = await api.put(`/tools/entries/${id}`, data);
    return response.data;
  },

  async deleteEntry(id) {
    const response = await api.delete(`/tools/entries/${id}`);
    return response.data;
  },
};
