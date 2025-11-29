const request = require("supertest");
const axios = require("axios");
const app = require("../../src/app");

jest.mock("axios");

describe("Middleware validarToken", () => {

  it("deve bloquear requisição sem token (401)", async () => {
    const res = await request(app).post("/api/carrinho").send({});
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Token de autenticação inválido ou não fornecido.");
  });

  it("deve permitir requisição com token válido", async () => {
    axios.post.mockResolvedValue({ data:{ valido:true, usuario:{id:1,cargo:"cliente"}} });
    const res = await request(app).post("/api/carrinho")
      .set("Authorization","Bearer tokenValido")
      .send({ produto_id:1, quantidade:1 });

    expect(res.status).not.toBe(401);
  });

});
