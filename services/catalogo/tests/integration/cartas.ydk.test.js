jest.mock("axios");
const axios = require("axios");

const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – Processar YDK (POST /api/cartas/ydk)", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
    axios.get.mockReset();
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar 400 se deckList for inválido", async () => {
    const res = await request(app)
      .post("/api/cartas/ydk")
      .send({ deckList: "errado" });

    expect(res.statusCode).toBe(400);
  });

  it("deve processar carta via API e salvar no banco", async () => {
    axios.get.mockResolvedValue({
      data: {
        data: [{
          id: 555,
          name: "Mock YDK Card",
          type: "Monster",
          atk: 1000,
          def: 1000,
          desc: "Mock Desc",
          card_prices: [{ cardmarket_price: 3 }],
          card_images: [{ image_url: "mock.png" }]
        }]
      }
    });

    const res = await request(app)
      .post("/api/cartas/ydk")
      .send({ deckList: [555] });

    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(1);

    const dbCheck = await db.query("SELECT * FROM cartas WHERE id = 555");
    expect(dbCheck.rows.length).toBe(1);
  });

});
