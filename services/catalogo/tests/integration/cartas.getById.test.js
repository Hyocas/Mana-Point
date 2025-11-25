jest.mock("axios");
const axios = require("axios");

const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – Buscar carta por ID (GET /api/cartas/:id)", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar 400 para ID inválido", async () => {
    const res = await request(app).get("/api/cartas/abc");
    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 404 quando não existe", async () => {
    const res = await request(app).get("/api/cartas/99999");
    expect(res.statusCode).toBe(404);
  });

  it("deve retornar carta quando existe (200)", async () => {
    await db.query(`
      INSERT INTO cartas (id, nome, quantidade)
      VALUES (1, 'Blue-Eyes White Dragon', 3)
    `);

    const res = await request(app).get("/api/cartas/1");

    expect(res.statusCode).toBe(200);
    expect(res.body.nome).toBe("Blue-Eyes White Dragon");
  });

});
