jest.mock("axios");
const axios = require("axios");

const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – Criar carta (POST /api/cartas)", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
    axios.get.mockReset();
    axios.post.mockReset();
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar 401 sem token", async () => {
    const res = await request(app)
      .post("/api/cartas")
      .send({ nome: "Blue-Eyes" });

    expect(res.statusCode).toBe(401);
  });

  it("deve criar carta via API quando validação passa", async () => {

    axios.post.mockResolvedValue({ status: 200 });

    axios.get.mockResolvedValue({
      data: {
        data: [{
          id: 123,
          name: "Mock Create",
          type: "Monster",
          desc: "Desc",
          atk: 1500,
          def: 1200,
          card_prices: [{ cardmarket_price: 2 }],
          card_images: [{ image_url: "mock.png" }]
        }]
      }
    });

    const res = await request(app)
      .post("/api/cartas")
      .set("Authorization", "Bearer faketoken")
      .send({ nome: "Mock Create" });

    expect(res.statusCode).toBe(201);

    const dbCheck = await db.query("SELECT * FROM cartas WHERE id = 123");
    expect(dbCheck.rows.length).toBe(1);
  });

});
