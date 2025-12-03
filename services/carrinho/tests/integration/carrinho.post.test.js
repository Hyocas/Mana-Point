const request = require("supertest");
const axios = require("axios");
const app = require("../../src/app");

jest.mock("axios");

describe("Logs do Carrinho (POST /api/carrinho)", () => {

  let logSpy, warnSpy, errorSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("deve logar tentativa de adicionar ao carrinho", async () => {
    axios.post.mockResolvedValue({
      data: { valido: true, usuario: { id: 1, cargo: "cliente" } }
    });

    await request(app)
      .post("/api/carrinho")
      .set("Authorization", "Bearer token")
      .send({ produto_id: 1, quantidade: 1 });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[POST /carrinho] - UsuarioId: 1"));
  });

  it("deve logar quando funcionário tenta comprar (403)", async () => {
    axios.post.mockResolvedValue({
      data: { valido: true, usuario: { id: 1, cargo: "funcionario" } }
    });

    await request(app)
      .post("/api/carrinho")
      .set("Authorization", "Bearer token")
      .send({ produto_id: 1, quantidade: 1 });

    expect(warnSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining("Erro"));
  });

  it("deve logar erro real no bloco catch (console.error)", async () => {
    axios.post.mockResolvedValue({
      data: { valido: true, usuario: { id: 1, cargo: "cliente" } }
    });

    jest.spyOn(require("../../src/db"), "query")
      .mockRejectedValue(new Error("DB FAIL"));

    await request(app)
      .post("/api/carrinho")
      .set("Authorization", "Bearer token")
      .send({ produto_id: 1, quantidade: 1 });

    expect(errorSpy).toHaveBeenCalled(); 
    expect(errorSpy.mock.calls[0][0]).toContain("ERRO REAL");
  });

});
