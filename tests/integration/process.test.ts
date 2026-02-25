import request from "supertest";
import app from "../../src/app";

describe("POST /process", () => {
  it("should return 400 for missing folderPath", async () => {
    const res = await request(app).post("/process").send({});
    expect(res.status).toBe(400);
  });
});
