const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");
const axios = require("axios");

jest.mock("axios");

describe("Integração – DELETE /api/cartas/:id", () => {
  beforeEach(async () => {
    await db.query("DELETE FROM cartas");
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar 401 se o token não for fornecido", async () => {
    const res = await request(app).delete("/api/cartas/1");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Token de autenticação não fornecido.");
  });

  it("deve retornar 401 se o token for inválido", async () => {
    axios.post.mockRejectedValueOnce({ response: { status: 401 } });

    const res = await request(app)
      .delete("/api/cartas/1")
      .set("Authorization", "Bearer tokenInvalido");

    expect(res.status).toBe(401);
  });

  it("deve retornar 400 se o ID for inválido", async () => {
    axios.post.mockResolvedValue({ status: 200 });

    const res = await request(app)
      .delete("/api/cartas/abc")
      .set("Authorization", "Bearer tokenValido");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("O ID fornecido é inválido.");
  });

  it("deve deletar carta existente com token válido (204)", async () => {
    axios.post.mockResolvedValue({ status: 200 });

    const { rows } = await db.query(`
      INSERT INTO cartas (nome, quantidade) 
      VALUES ('Mock Delete', 1) 
      RETURNING id
    `);
    const cartaId = rows[0].id;

    const res = await request(app)
      .delete(`/api/cartas/${cartaId}`)
      .set("Authorization", "Bearer tokenValido");

    expect(res.status).toBe(204);
  });

  it("deve retornar 500 se ocorrer erro interno no banco", async () => {
    axios.post.mockResolvedValue({ status: 200 });

    jest.spyOn(db, "query").mockRejectedValueOnce(new Error("Erro interno"));

    const res = await request(app)
      .delete("/api/cartas/1")
      .set("Authorization", "Bearer tokenValido");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Erro interno do servidor.");

    db.query.mockRestore();
  });
});
