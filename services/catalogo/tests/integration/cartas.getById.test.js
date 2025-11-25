jest.mock("axios", () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    }
  };

  return {
    create: () => mockAxiosInstance,
    post: jest.fn(),
    mockInstance: mockAxiosInstance
  };
});

const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – GET /api/cartas/:id", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar carta existente", async () => {

    await db.query(`
      INSERT INTO cartas (id, nome, tipo, ataque, defesa, efeito, preco, imagem_url, quantidade)
      VALUES (10, 'Blue-Eyes White Dragon', null, null, null, null, 0, null, 0)
    `);

    const res = await request(app).get("/api/cartas/10");

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe("Blue-Eyes White Dragon");
  });

});
