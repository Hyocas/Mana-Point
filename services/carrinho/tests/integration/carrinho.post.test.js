jest.mock("../../src/db");
jest.mock("axios");

const request = require("supertest");
const axios = require("axios");
const db = require("../../src/db");
const app = require("../../src/app");

describe("Logs do Carrinho (POST /api/carrinho)", () => {

  let consoleSpy;
  let errorSpy;

  beforeEach(async () => {
    jest.clearAllMocks();

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    db.query.mockResolvedValue();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
  });

  it("deve logar as mensagens principais do fluxo normal", async () => {
    axios.post.mockResolvedValue({
      data: { valido: true, usuario: { id: 1, cargo: "cliente" } }
    });

    const mockQuery = jest
      .fn()
      .mockResolvedValueOnce({}) 
      .mockResolvedValueOnce({ rows: [{ preco: 20.00, quantidade: 5 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 99, quantidade: 1 }] });

    db.pool.connect.mockResolvedValue({
      query: mockQuery,
      release: jest.fn()
    });

    await request(app)
      .post("/api/carrinho")
      .set("Authorization", "Bearer tokenValido")
      .send({ produto_id: 1, quantidade: 1 });

    expect(consoleSpy).toHaveBeenCalled();
  });

  it("deve logar erro real no bloco catch (console.error)", async () => {
    axios.post.mockResolvedValue({
      data: { valido: true, usuario: { id: 1, cargo: "cliente" } }
    });

    const mockQuery = jest
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ preco: 20.00, quantidade: 5 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(new Error("DB FAIL"));

    db.pool.connect.mockResolvedValue({
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
