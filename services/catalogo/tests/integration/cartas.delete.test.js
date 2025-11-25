jest.mock("axios");
const axios = require("axios");

const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – Deletar carta (DELETE /api/cartas/:id)", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
    axios.post.mockReset();
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar 401 sem token", async () => {
    const res = await request(app)
      .delete("/api/cartas/1");

    expect(res.statusCode).toBe(401);
  });

  it("deve deletar carta existente quando autorizado (204)", async () => {

    axios.post.mockResolvedValue({ status: 200 });

    await db.query(`
      INSERT INTO cartas (id, nome, quantidade)
      VALUES (10, 'Mock', 5)
    `);

    const res = await request(app)
      .delete("/api/cartas/10")
      .set("Authorization", "Bearer faketoken");

    expect(res.statusCode).toBe(204);

    const check = await db.query("SELECT * FROM cartas WHERE id = 10");
    expect(check.rows.length).toBe(0);
  });

});
