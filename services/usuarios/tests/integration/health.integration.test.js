const request = require("supertest");
const app = require("../../src/app");

describe("Health Check", () => {
    it("deve retornar UP", async () => {
        const res = await request(app).get("/health");

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe("UP");
    });
});
