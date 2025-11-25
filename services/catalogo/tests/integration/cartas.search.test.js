jest.mock("../../src/apiClient", () => ({
  get: jest.fn(),
  post: jest.fn()
}));

const apiClient = require("../../src/apiClient");
const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

describe("Integração – GET /api/cartas/search", () => {

  beforeEach(async () => {
    await db.query("DELETE FROM cartas;");
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await db.end();
  });

  it("deve retornar 400 sem nome", async () => {
    const res = await request(app).get("/api/cartas/search?nome=");
    expect(res.statusCode).toBe(400);
  });

  it("deve retornar cartas existentes no banco", async () => {
    await db.query(`
      INSERT INTO cartas (id, nome, efeito)
      VALUES (1, 'Dark Magician', 'efeito mágico')
    `);

    const res = await request(app).get("/api/cartas/search?nome=Dark");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("deve buscar na API quando não encontrado localmente", async () => {
    apiClient.get.mockResolvedValue({
      data: {
        data: [{
          id: 777,
          name: "Mock API Card",
          desc: "mock desc",
          type: "Spell",
          card_prices: [{ cardmarket_price: 1 }],
          card_images: [{ image_url: "mock.png" }]
        }]
      }
    });

    const res = await request(app).get("/api/cartas/search?nome=Mock");
    expect(res.statusCode).toBe(200);

    const check = await db.query("SELECT * FROM cartas WHERE id = 777");
    expect(check.rows.length).toBe(1);
  });

});
