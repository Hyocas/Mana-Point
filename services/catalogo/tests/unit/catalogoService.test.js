jest.mock('axios');
jest.mock('../../src/db');

jest.mock('axios-retry', () => {
  const mockFn = jest.fn();
  mockFn.exponentialDelay = jest.fn(() => 100);
  return mockFn;
});

const axios = require('axios');
const db = require('../../src/db');

const mockApiClient = {
  get: jest.fn(),
};

axios.create.mockReturnValue(mockApiClient);

jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));

const catalogoService = require('../../src/services/catalogoService');
catalogoService.sleep = jest.fn().mockResolvedValue();

const mockCardAPI = {
  data: {
    data: [
      {
        id: 123,
        name: 'Dark Magician',
        type: 'Spellcaster',
        atk: 2500,
        def: 2100,
        desc: 'Descrição teste',
        card_prices: [{ cardmarket_price: "1.00" }],
        card_images: [{ image_url: "http://img.com/carta.png" }]
      }
    ]
  }
};

describe('catalogoService.processarYdk', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve lançar erro quando deckList não é array', async () => {
    await expect(catalogoService.processarYdk("abc"))
      .rejects
      .toMatchObject({ status: 400 });
  });

  test('deve retornar cartas do banco sem chamar API', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, nome: "Carta do DB" }]
    });

    const result = await catalogoService.processarYdk([1]);

    expect(result.total).toBe(1);
    expect(db.query).toHaveBeenCalledTimes(2);
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });

  test('deve chamar API quando carta não está no banco', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    mockApiClient.get.mockResolvedValue(mockCardAPI);

    db.query.mockResolvedValueOnce({
      rows: [{ id: 123, nome: "Dark Magician" }]
    });

    const result = await catalogoService.processarYdk([123]);

    expect(mockApiClient.get).toHaveBeenCalledTimes(1);
    expect(result.total).toBe(1);
  });

});

describe('catalogoService.buscarPorNomeOuEfeito', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve lançar erro quando nome não for fornecido', async () => {
    await expect(catalogoService.buscarPorNomeOuEfeito(""))
      .rejects.toMatchObject({ status: 400 });
  });

  test('deve retornar cartas encontradas no banco por nome', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 10, nome: "Blue-Eyes" }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await catalogoService.buscarPorNomeOuEfeito("blue");

    expect(result.length).toBe(1);
    expect(result[0].nome).toBe("Blue-Eyes");
  });

  test('deve buscar na API quando DB não retornar nada', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    mockApiClient.get.mockResolvedValue(mockCardAPI);

    db.query.mockResolvedValueOnce({
      rows: [{ id: 123, nome: "Dark Magician" }]
    });

    const result = await catalogoService.buscarPorNomeOuEfeito("Dark");

    expect(result.length).toBe(1);
  });

  test('deve lançar erro 404 quando nenhum resultado encontrado', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    mockApiClient.get.mockRejectedValue(new Error("not found"));

    await expect(catalogoService.buscarPorNomeOuEfeito("aaaaaaa"))
      .rejects.toMatchObject({ status: 404 });
  });

});

describe('catalogoService.listarCartas', () => {

  test('deve retornar lista de cartas', async () => {
    db.query.mockResolvedValue({
      rows: [{ id: 1 }, { id: 2 }]
    });

    const result = await catalogoService.listarCartas();

    expect(result.length).toBe(2);
  });

});

describe('catalogoService.buscarCartaPorId', () => {

  test('deve lançar erro quando id for inválido', async () => {
    await expect(catalogoService.buscarCartaPorId("abc"))
      .rejects.toMatchObject({ status: 400 });
  });

  test('deve lançar erro quando carta não existir', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await expect(catalogoService.buscarCartaPorId(999))
      .rejects.toMatchObject({ status: 404 });
  });

  test('deve retornar carta válida', async () => {
    db.query.mockResolvedValue({
      rows: [{ id: 10, nome: "Carta X" }]
    });

    const result = await catalogoService.buscarCartaPorId(10);

    expect(result.id).toBe(10);
  });

});

describe('catalogoService.adicionarCartaPorNome', () => {

  test('deve falhar sem token', async () => {
    await expect(catalogoService.adicionarCartaPorNome("Dark", 1))
      .rejects.toMatchObject({ status: 401 });
  });

  test('deve retornar carta já existente', async () => {
    axios.post.mockResolvedValue({ data: { valido: true } });
    db.query.mockResolvedValueOnce({
      rows: [{ id: 5, nome: "Dark Magician" }]
    });

    const result = await catalogoService.adicionarCartaPorNome("Dark", 1, "token123");

    expect(result.jaExistente).toBe(true);
  });

  test('deve inserir carta nova', async () => {
    axios.post.mockResolvedValue({ data: { valido: true } });
    db.query.mockResolvedValueOnce({ rows: [] });

    mockApiClient.get.mockResolvedValue(mockCardAPI);

    db.query.mockResolvedValueOnce({
      rows: [{ id: 123, nome: "Dark Magician" }]
    });

    const result = await catalogoService.adicionarCartaPorNome("Dark", 1, "token123");

    expect(result.id).toBe(123);
    expect(mockApiClient.get).toHaveBeenCalled();
  });

});

describe('catalogoService.apagarCatalogo', () => {

  test('deve falhar sem token', async () => {
    await expect(catalogoService.apagarCatalogo())
      .rejects.toMatchObject({ status: 401 });
  });

  test('deve apagar cartas', async () => {
    axios.post.mockResolvedValue({});
    db.query.mockResolvedValue({});

    await catalogoService.apagarCatalogo("token123");

    expect(db.query).toHaveBeenCalledWith('DELETE FROM cartas');
  });

});

describe('catalogoService.apagarCartaPorId', () => {

  test('deve falhar sem token', async () => {
    await expect(catalogoService.apagarCartaPorId(10))
      .rejects.toMatchObject({ status: 401 });
  });

  test('deve falhar com ID inválido', async () => {
    await expect(catalogoService.apagarCartaPorId("abc", "token"))
      .rejects.toMatchObject({ status: 400 });
  });

  test('deve apagar carta existente', async () => {
    axios.post.mockResolvedValue({ data: { valido: true } });
    db.query.mockResolvedValueOnce({
      rows: [{ id: 10, nome: "Carta X" }]
    });

    const result = await catalogoService.apagarCartaPorId(10, "token");

    expect(result.id).toBe(10);
  });

  test('deve lançar erro quando carta não existir', async () => {
    axios.post.mockResolvedValue({ data: { valido: true } });
    db.query.mockResolvedValueOnce({ rows: [] });

    await expect(catalogoService.apagarCartaPorId(999, "token"))
      .rejects.toMatchObject({ status: 404 });
  });

});
