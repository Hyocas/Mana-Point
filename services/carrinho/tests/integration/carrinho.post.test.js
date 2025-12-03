const request = require("supertest");
const axios = require("axios");
const app = require("../../src/app");
const db = require("../../src/db");

jest.mock("axios");

describe("Logs do Carrinho (POST /api/carrinho)", () => {

  let consoleSpy;
  let errorSpy;

  beforeEach(async () => {
    jest.clearAllMocks();

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await db.query("DELETE FROM carrinho_itens;");
    await db.query("DELETE FROM cartas;");
    await db.query("DELETE FROM usuarios;");

    await db.query(`
      INSERT INTO usuarios (id, email, senha_hash) VALUES (1, 'teste@teste.com', '123')
    `);

    await db.query(`
      INSERT INTO cartas (id, nome, preco, quantidade)
      VALUES (1, 'Dark Magician', 20.00, 5)
    `);
  });

  afterAll(async () => {
    await db.pool.end();
  });

  it("deve logar as mensagens principais do fluxo normal", async () => {
    axios.post.mockResolvedValue({
      data: { valido: true, usuario: { id: 1, cargo: "cliente" } }
    });

    await request(app)
      .post("/api/carrinho")
      .set("Authorization", "Bearer tokenValido")
      .send({ produto_id: 1, quantidade: 1 });

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls.some(c => c[0].includes("[POST /carrinho]"))).toBe(true);
  });

  it("deve logar erro real no bloco catch (console.error)", async () => {
    axios.post.mockResolvedValue({
      data: { valido: true, usuario: { id: 1, cargo: "cliente" } }
    });

    const mockQuery = jest.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ preco: 20.00, quantidade: 5 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(new Error("DB FAIL"));
    jest.spyOn(db.pool, "connect").mockResolvedValue({
      query: mockQuery,
      release: jest.fn()
    });

    await request(app)
      .post("/api/carrinho")
      .set("Authorization", "Bearer tokenValido")
      .send({ produto_id: 1, quantidade: 1 });

    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy.mock.calls[0][0]).toContain("ERRO REAL");
  });

});
