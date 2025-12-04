const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

// Mock do axios e axios.create (para lidar com axiosRetry)
jest.mock("axios", () => {
  const mockAxiosInstance = {
    post: jest.fn(),
    get: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
  };

  return {
    create: jest.fn(() => mockAxiosInstance),
    post: jest.fn(),
    mockInstance: mockAxiosInstance
  };
});

const axios = require("axios");

describe("Integração – DELETE /api/cartas/:id", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar 401 quando não houver token no header", async () => {
    const res = await request(app).delete("/api/cartas/10");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Token de autenticação não fornecido.");
  });

  it("deve retornar 401 quando o token for inválido", async () => {
    axios.mockInstance.post.mockRejectedValueOnce({ response: { status: 401 } });

    const res = await request(app)
      .delete("/api/cartas/10")
      .set("Authorization", "Bearer tokenInvalido");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Acesso não autorizado. Token inválido.");
  });

  it("deve retornar 400 para ID inválido (não numérico)", async () => {
    axios.mockInstance.post.mockResolvedValueOnce({ status: 200 });

    const res = await request(app)
      .delete("/api/cartas/abc")
      .set("Authorization", "Bearer tokenFake");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("O ID fornecido é inválido.");
  });

  it("deve deletar carta existente com token válido (204)", async () => {
    axios.mockInstance.post.mockResolvedValueOnce({ status: 200 });

    await db.query(`
      INSERT INTO cartas (id, nome, tipo, ataque, defesa, efeito, preco, imagem_url, quantidade)
      VALUES (20, 'Mock Delete', null, null, null, null, 0, null, 1)
    `);

    const res = await request(app)
      .delete("/api/cartas/20")
      .set("Authorization", "Bearer tokenFake");

    expect(res.status).toBe(204);
  });

  it("deve retornar 500 se ocorrer erro interno no banco", async () => {
    axios.mockInstance.post.mockResolvedValueOnce({ status: 200 });

    jest.spyOn(db, "query").mockRejectedValueOnce(new Error("DB FAIL"));

    const res = await request(app)
      .delete("/api/cartas/30")
      .set("Authorization", "Bearer tokenFake");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Erro interno do servidor.");
  });

});
