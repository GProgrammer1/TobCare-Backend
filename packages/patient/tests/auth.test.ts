import request from "supertest"
import { getApp } from "../../common/tests/setup"

describe("POST /api/v1/patient/auth/signup", () => {
  it("should return 500 when required fields are missing (no validation middleware yet)", async () => {
    const res = await request(getApp())
      .post("/api/v1/patient/auth/signup")
      .send({})

    // No Zod validation on this route yet, so the service crashes with a Prisma error
    expect(res.status).toBe(500)
  })
})
