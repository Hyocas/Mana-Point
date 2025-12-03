const request = require("supertest");
const axios = require("axios");
const app = require("../../src/app");
const db = require("../../src/db");

jest.mock("axios");

describe("Logs do Carrinho (GET /api/carrinho)", () => {

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
      INSERT INTO usuarios (id, email, senha_hash)
      VALUES (1, 'teste@teste.com', '123')
    `);

    await db.query(`
      INSERT INTO cartas (id, nome, preco, quantidade)
      VALUES (1, 'Dark Magician', 20.00, 5),
             (2, 'Blue-Eyes',      30.00, 8)
    `);

    await db.query(`
      INSERT INTO carrinho_itens (usuario_id, produto_id, quantidade, preco_unitario)
      VALUES 
      (1, 1, 2, 20.00),
      (1, 2, 1, 30.00)
    `);
  });

  afterAll(async () => {
    if (!db.pool.ended) {
      await db.pool.end();
    }
  });

  it("deve retornar itens do carrinho e gerar logs de fluxo normal", async () => {
    axios.post.mockResolvedValue({
      data: { valido: true, usuario: { id: 1, cargo: "cliente" } }
    });

    const res = await request(app)
      .get("/api/carrinho")
      .set("Authorization", "Bearer tokenValido");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls.some(c => c[0].includes("[GET /carrinho]"))).toBe(true);
  });

  it("deve logar erro real no bloco catch (console.error) ao falhar no DB", async () => {
    axios.post.mockResolvedValue({
      data: { valido: true, usuario: { id: 1, cargo: "cliente" } }
    });

    const mockQuery = jest
      .fn()
      .mockRejectedValueOnce(new Error("DB FAIL"));

    jest.spyOn(db.pool, "connect").mockResolvedValue({
      query: mockQuery,
      release: jest.fn()
    });

    await request(app)
      .get("/api/carrinho")
      .set("Authorization", "Bearer tokenValido");

    if (!db.pool.ended) {
      await db.pool.end();
    }

    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy.mock.calls[0][0]).toContain("ERRO REAL");
  });

});
