jest.mock("../../src/apiClient", () => ({
  get: jest.fn(),
  post: jest.fn()
}));

const apiClient = require("../../src/apiClient");
const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – DELETE /api/cartas/:id", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar 401 sem token", async () => {
    const res = await request(app).delete("/api/cartas/1");
    expect(res.statusCode).toBe(401);
  });

  it("deve deletar carta existente com token válido", async () => {
    apiClient.post.mockResolvedValue({ status: 200 });

    await db.query(`
      INSERT INTO cartas (id, nome, quantidade)
      VALUES (20, 'Mock Delete', 1)
    `);

    const res = await request(app)
      .delete("/api/cartas/20")
      .set("Authorization", "Bearer tokenFake");

    expect(res.statusCode).toBe(204);

    const check = await db.query("SELECT * FROM cartas WHERE id = 20");
    expect(check.rows.length).toBe(0);
  });

});
