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
  it("deve retornar 404 quando a carta não existir", async () => {
    const res = await request(app).get("/api/cartas/99999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Carta não encontrada.");
  });
  it("deve retornar 400 para ID inválido", async () => {
    const res = await request(app).get("/api/cartas/abc");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("O ID fornecido é inválido.");
  });
  it("deve retornar 500 caso o banco falhe", async () => {
    jest.spyOn(db, "query").mockRejectedValue(new Error("Falha no banco"));

    const res = await request(app).get("/api/cartas/10");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Erro interno do servidor.");

    db.query.mockRestore();
  });

});
