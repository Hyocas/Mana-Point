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

describe("Integração – GET /api/cartas", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar 200 e listar cartas cadastradas", async () => {
    await db.query(`
      INSERT INTO cartas (id, nome, tipo, ataque, defesa, efeito, preco, imagem_url, quantidade)
      VALUES (1,'TEST',null,null,null,null,0,null,1)
    `);

    const res = await request(app).get("/api/cartas");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("deve retornar 500 caso ocorra erro inesperado no banco", async () => {
    jest.spyOn(db,"query").mockRejectedValue(new Error("explode"));

    const res = await request(app).get("/api/cartas");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Erro interno do servidor.");

    db.query.mockRestore();
  });

});
