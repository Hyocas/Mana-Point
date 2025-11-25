jest.mock("axios");
const axios = require("axios");

const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – Listar cartas (GET /api/cartas)", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar lista vazia (200)", async () => {
    const res = await request(app).get("/api/cartas");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("deve retornar cartas cadastradas (200)", async () => {
    await db.query(`
      INSERT INTO cartas (id, nome, quantidade)
      VALUES (1, 'Dark Magician', 5)
    `);

    const res = await request(app).get("/api/cartas");

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].nome).toBe("Dark Magician");
  });

});
