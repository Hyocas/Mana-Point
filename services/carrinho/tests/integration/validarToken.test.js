const request = require("supertest");
const axios = require("axios");
const app = require("../../src/app");

jest.mock("axios");

describe("Middleware validarToken", () => {

  it("bloqueia requisição sem token", async () => {
    const res = await request(app).get("/api/carrinho/1");
    expect(res.status).toBe(401);
  });

  it("permite requisição com token válido", async () => {
    axios.post.mockResolvedValue({data:{valido:true,usuario:{id:1,cargo:"cliente"}}});
    const res = await request(app).get("/api/carrinho/1").set("Authorization","Bearer token");
    expect(res.status).not.toBe(401);
  });

});
