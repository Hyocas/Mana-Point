const request = require('supertest');
const app = require('../../src/app');
const axios = require('axios');

const mockAxiosInstance = {
  post: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxiosInstance),
  ...jest.requireActual('axios'),
}));

describe('Integração – DELETE /api/cartas/:id', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve deletar carta existente com token válido (204)', async () => {
    mockAxiosInstance.post.mockImplementationOnce((url, data) => {
      if (url.includes('validar-token') && data.token === 'tokenValido') {
        return Promise.resolve({ status: 200 });
      }
      return Promise.reject({ response: { status: 401 } });
    });

    mockAxiosInstance.delete.mockResolvedValueOnce({ status: 204 });

    const res = await request(app)
      .delete('/api/cartas/12345')
      .set('Authorization', 'tokenValido');

    expect(res.status).toBe(204);
  });

  it('deve retornar 401 se o token for inválido', async () => {
    mockAxiosInstance.post.mockRejectedValueOnce({ response: { status: 401 } });

    const res = await request(app)
      .delete('/api/cartas/12345')
      .set('Authorization', 'tokenInvalido');

    expect(res.status).toBe(401);
  });

  it('deve retornar 500 se ocorrer erro interno no banco', async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({ status: 200 });
    mockAxiosInstance.delete.mockRejectedValueOnce(new Error('Erro interno do servidor.'));

    const res = await request(app)
      .delete('/api/cartas/12345')
      .set('Authorization', 'tokenValido');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Erro interno do servidor.');
  });

});
