const catalogoController = require('../controllers/catalogoController');
const catalogoService = require('../services/catalogoService');

const mockRequest = (data = {}) => data;
const mockResponse = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

jest.mock('../services/catalogoService');

describe('CatalogoController', () => {

  beforeEach(() => jest.clearAllMocks());

  describe('processarYdk', () => {
    it('deve retornar status 200 e o resultado do service', async () => {
      const req = mockRequest({ body: { deckList: '...conteúdo...' } });
      const res = mockResponse();

      catalogoService.processarYdk.mockResolvedValue({ ok: true });

      await catalogoController.processarYdk(req, res);

      expect(catalogoService.processarYdk).toHaveBeenCalledWith('...conteúdo...');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('deve retornar erro caso o service lance exceção', async () => {
      const req = mockRequest({ body: { deckList: 'x' } });
      const res = mockResponse();

      catalogoService.processarYdk.mockRejectedValue({ message: 'Falhou', status: 400 });

      await catalogoController.processarYdk(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Falhou' });
    });
  });

  describe('buscar', () => {
    it('deve retornar 200 com resultado da busca', async () => {
      const req = mockRequest({ query: { nome: 'Dark Magician' } });
      const res = mockResponse();

      catalogoService.buscarPorNomeOuEfeito.mockResolvedValue([{ id: 1 }]);

      await catalogoController.buscar(req, res);

      expect(catalogoService.buscarPorNomeOuEfeito)
        .toHaveBeenCalledWith('Dark Magician');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
    });

    it('deve retornar erro tratado do service', async () => {
      const req = mockRequest({ query: { nome: 'x' } });
      const res = mockResponse();

      catalogoService.buscarPorNomeOuEfeito.mockRejectedValue({
        status: 404,
        message: 'Não encontrado'
      });

      await catalogoController.buscar(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não encontrado' });
    });
  });

  describe('listar', () => {
    it('deve retornar lista de cartas', async () => {
      const req = mockRequest();
      const res = mockResponse();

      catalogoService.listarCartas.mockResolvedValue([{ id: 1 }]);

      await catalogoController.listar(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
    });

    it('deve retornar erro 500', async () => {
      const req = mockRequest();
      const res = mockResponse();

      catalogoService.listarCartas.mockRejectedValue(new Error('Falha'));

      await catalogoController.listar(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Erro interno do servidor.' });
    });
  });

  describe('buscarPorId', () => {
    it('deve retornar carta por ID', async () => {
      const req = mockRequest({ params: { id: '10' } });
      const res = mockResponse();

      catalogoService.buscarCartaPorId.mockResolvedValue({ id: 10 });

      await catalogoController.buscarPorId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: 10 });
    });

    it('deve tratar erro com status customizado', async () => {
      const req = mockRequest({ params: { id: '10' } });
      const res = mockResponse();

      catalogoService.buscarCartaPorId.mockRejectedValue({
        status: 404,
        message: 'Não encontrada'
      });

      await catalogoController.buscarPorId(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json)
        .toHaveBeenCalledWith({ message: 'Não encontrada' });
    });
  });

  describe('adicionar', () => {

    const baseReq = {
      headers: { authorization: 'Bearer TOKEN123' }
    };

    it('deve adicionar carta e retornar 201', async () => {
      const req = mockRequest({
        ...baseReq,
        body: { nome: 'Blue-Eyes', quantidade: 2 }
      });
      const res = mockResponse();

      catalogoService.adicionarCartaPorNome.mockResolvedValue({ id: 1 });

      await catalogoController.adicionar(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 1 });
    });

    it('deve retornar 200 se carta já existir', async () => {
      const req = mockRequest({
        ...baseReq,
        body: { nome: 'Blue-Eyes', quantidade: 1 }
      });
      const res = mockResponse();

      catalogoService.adicionarCartaPorNome.mockResolvedValue({
        jaExistente: true
      });

      await catalogoController.adicionar(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar erro se faltar nome', async () => {
      const req = mockRequest({
        ...baseReq,
        body: { nome: '' }
      });
      const res = mockResponse();

      await catalogoController.adicionar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('deve retornar 401 se faltar token', async () => {
      const req = mockRequest({
        headers: {},
        body: { nome: 'Teste' }
      });
      const res = mockResponse();

      await catalogoController.adicionar(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('apagarCatalogo', () => {
    it('deve apagar catálogo e retornar 204', async () => {
      const req = mockRequest({
        headers: { authorization: 'Bearer abc' }
      });
      const res = mockResponse();

      catalogoService.apagarCatalogo.mockResolvedValue();

      await catalogoController.apagarCatalogo(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('deve retornar erro tratado', async () => {
      const req = mockRequest({
        headers: { authorization: 'Bearer abc' }
      });
      const res = mockResponse();

      catalogoService.apagarCatalogo.mockRejectedValue({
        status: 401,
        message: 'Token inválido.'
      });

      await catalogoController.apagarCatalogo(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('apagarPorId', () => {
    it('deve apagar e retornar 204', async () => {
      const req = mockRequest({
        headers: { authorization: 'Bearer xyz' },
        params: { id: '5' }
      });
      const res = mockResponse();

      catalogoService.apagarCartaPorId.mockResolvedValue();

      await catalogoController.apagarPorId(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('deve retornar erro com status do service', async () => {
      const req = mockRequest({
        headers: { authorization: 'Bearer xyz' },
        params: { id: '5' }
      });
      const res = mockResponse();

      catalogoService.apagarCartaPorId.mockRejectedValue({
        status: 404,
        message: 'Não encontrada'
      });

      await catalogoController.apagarPorId(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não encontrada' });
    });
  });

});
