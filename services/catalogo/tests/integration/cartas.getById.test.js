jest.mock("../../src/apiClient", () => ({
  get: jest.fn(),
  post: jest.fn()
}));

const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – GET /api/cartas/:id", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar 400 para ID inválido", async () => {
    const res = await request(app).get("/api/cartas/abc");
    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 404 quando não existir", async () => {
    const res = await request(app).get("/api/cartas/999999");
    expect(res.statusCode).toBe(404);
  });

  it("deve retornar carta existente", async () => {
    await db.query(`
      INSERT INTO cartas (id, nome)
      VALUES (10, 'Blue-Eyes White Dragon')
    `);

    const res = await request(app).get("/api/cartas/10");
    expect(res.statusCode).toBe(200);
    expect(res.body.nome).toBe("Blue-Eyes White Dragon");
  });

});
