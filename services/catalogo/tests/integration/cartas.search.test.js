jest.mock("axios");
const axios = require("axios");

const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – Busca de cartas (GET /api/cartas/search)", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
    axios.get.mockReset();
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar 400 se nome faltar", async () => {
    const res = await request(app).get("/api/cartas/search?nome=");
    expect(res.statusCode).toBe(400);
  });

  it("deve retornar cartas que já existem no banco (200)", async () => {
    await db.query(`
      INSERT INTO cartas (id, nome, efeito)
      VALUES (1, 'Dark Magician', 'Spellcaster')
    `);

    const res = await request(app).get("/api/cartas/search?nome=Dark");

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].nome).toBe("Dark Magician");
  });

  it("deve adicionar carta via API YGOProDeck quando não existe localmente", async () => {

    axios.get.mockResolvedValue({
      data: {
        data: [{
          id: 777,
          name: "Mock Card Search",
          type: "Spell",
          desc: "Mock Desc",
          card_prices: [{ cardmarket_price: 1 }],
          card_images: [{ image_url: "mock.png" }]
        }]
      }
    });

    const res = await request(app).get("/api/cartas/search?nome=Mock");

    expect(res.statusCode).toBe(200);
    expect(res.body[0].nome).toBe("Mock Card Search");

    const dbCheck = await db.query("SELECT * FROM cartas WHERE id = 777");
    expect(dbCheck.rows.length).toBe(1);
  });

});
