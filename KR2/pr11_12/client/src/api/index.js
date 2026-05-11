import axios from 'axios';

const client = axios.create({ baseURL: 'http://localhost:3000/api' });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('http://localhost:3000/api/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          orig.headers.Authorization = `Bearer ${data.accessToken}`;
          return client(orig);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  register: (email, first_name, last_name, password) =>
    client.post('/auth/register', { email, first_name, last_name, password }),
  login: (email, password) => client.post('/auth/login', { email, password }),
  refresh: (refreshToken) => client.post('/auth/refresh', { refreshToken }),
  me: () => client.get('/auth/me'),

  getUsers: () => client.get('/users'),
  updateUserRole: (id, role) => client.patch(`/users/${id}/role`, { role }),
  deleteUser: (id) => client.delete(`/users/${id}`),

  getProducts: () => client.get('/products'),
  getProductById: (id) => client.get(`/products/${id}`),
  createProduct: (data) => client.post('/products', data),
  updateProduct: (id, data) => client.put(`/products/${id}`, data),
  deleteProduct: (id) => client.delete(`/products/${id}`),
};
