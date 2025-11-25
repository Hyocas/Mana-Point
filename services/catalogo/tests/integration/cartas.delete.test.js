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

const axios = require("axios");
const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – DELETE /api/cartas/:id", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve deletar carta existente com token válido", async () => {

    axios.post.mockResolvedValue({ status: 200 });

    await db.query(`
      INSERT INTO cartas (id, nome, tipo, ataque, defesa, efeito, preco, imagem_url, quantidade)
      VALUES (20, 'Mock Delete', null, null, null, null, 0, null, 1)
    `);

    const res = await request(app)
      .delete("/api/cartas/20")
      .set("Authorization", "Bearer tokenFake");

    expect(res.status).toBe(204);
  });
});
