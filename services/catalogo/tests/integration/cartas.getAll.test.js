jest.mock("../../src/apiClient", () => ({
  get: jest.fn(),
  post: jest.fn()
}));

const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – GET /api/cartas", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar lista vazia", async () => {
    const res = await request(app).get("/api/cartas");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("deve retornar cartas cadastradas", async () => {
    await db.query(`
      INSERT INTO cartas (id, nome, quantidade)
      VALUES (1, 'Dark Magician', 5)
    `);

    const res = await request(app).get("/api/cartas");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

});
