import request from "supertest"
import { getApp } from "./setup"

const FIXED_OTP = "123456"

// Valid signup payload
const validSignup = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  password: "StrongP@ss1",
  role: "PATIENT",
  phoneNumber: 1234567890,
}

describe("POST /api/v1/auth/signup", () => {
  it("should create a new user and return 201", async () => {
    const res = await request(getApp())
      .post("/api/v1/auth/signup")
      .send(validSignup)

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty("id")
    expect(res.body).toHaveProperty("createdAt")
  })

  it("should return 400 when signing up with duplicate email", async () => {
    await request(getApp())
      .post("/api/v1/auth/signup")
      .send(validSignup)

    const res = await request(getApp())
      .post("/api/v1/auth/signup")
      .send(validSignup)

    expect(res.status).toBe(400)
  })

  it("should return 400 for weak password (no uppercase)", async () => {
    const res = await request(getApp())
      .post("/api/v1/auth/signup")
      .send({ ...validSignup, password: "weakpass1!" })

    expect(res.status).toBe(400)
  })

  it("should return 400 for weak password (no digit)", async () => {
    const res = await request(getApp())
      .post("/api/v1/auth/signup")
      .send({ ...validSignup, password: "StrongPass!" })

    expect(res.status).toBe(400)
  })

  it("should return 400 for weak password (no special char)", async () => {
    const res = await request(getApp())
      .post("/api/v1/auth/signup")
      .send({ ...validSignup, password: "StrongPass1" })

    expect(res.status).toBe(400)
  })

  it("should return 400 for weak password (too short)", async () => {
    const res = await request(getApp())
      .post("/api/v1/auth/signup")
      .send({ ...validSignup, password: "St@1" })

    expect(res.status).toBe(400)
  })

  it("should return 400 for invalid email format", async () => {
    const res = await request(getApp())
      .post("/api/v1/auth/signup")
      .send({ ...validSignup, email: "not-an-email" })

    expect(res.status).toBe(400)
  })

  it("should return 400 when required fields are missing", async () => {
    const res = await request(getApp())
      .post("/api/v1/auth/signup")
      .send({ email: "john@example.com" })

    expect(res.status).toBe(400)
  })
})

describe("POST /api/v1/auth/send-otp", () => {
  it("should return 200 with generic message when user exists", async () => {
    // Sign up first
    await request(getApp())
      .post("/api/v1/auth/signup")
      .send(validSignup)

    const res = await request(getApp())
      .post("/api/v1/auth/send-otp")
      .send({ email: validSignup.email })

    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/verification code/i)
  })

  it("should return 200 with same generic message when user does NOT exist (anti-enumeration)", async () => {
    const res = await request(getApp())
      .post("/api/v1/auth/send-otp")
      .send({ email: "nonexistent@example.com" })

    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/verification code/i)
  })

  it("should return 400 for invalid email format", async () => {
    const res = await request(getApp())
      .post("/api/v1/auth/send-otp")
      .send({ email: "not-valid" })

    expect(res.status).toBe(400)
  })
})

describe("POST /api/v1/auth/verify-otp", () => {

  it("should return 200 on correct OTP after signup + send-otp", async () => {
    // Sign up
    await request(getApp())
      .post("/api/v1/auth/signup")
      .send(validSignup)

    // Send OTP
    await request(getApp())
      .post("/api/v1/auth/send-otp")
      .send({ email: validSignup.email })

    // Verify OTP
    const res = await request(getApp())
      .post("/api/v1/auth/verify-otp")
      .send({ email: validSignup.email, otp: FIXED_OTP })

    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/verified/i)
  })

  it("should return 400 on wrong OTP", async () => {
    await request(getApp())
      .post("/api/v1/auth/signup")
      .send(validSignup)

    await request(getApp())
      .post("/api/v1/auth/send-otp")
      .send({ email: validSignup.email })

    const res = await request(getApp())
      .post("/api/v1/auth/verify-otp")
      .send({ email: validSignup.email, otp: "999999" })

    expect(res.status).toBe(400)
  })

  it("should return 400 when no OTP was sent (expired/missing)", async () => {
    const res = await request(getApp())
      .post("/api/v1/auth/verify-otp")
      .send({ email: validSignup.email, otp: "123456" })

    expect(res.status).toBe(400)
  })

  it("should return 400 on invalid OTP format (non-6-digit)", async () => {
    const res = await request(getApp())
      .post("/api/v1/auth/verify-otp")
      .send({ email: validSignup.email, otp: "12" })

    expect(res.status).toBe(400)
  })

  it("should return 400 on OTP with non-numeric characters", async () => {
    const res = await request(getApp())
      .post("/api/v1/auth/verify-otp")
      .send({ email: validSignup.email, otp: "abcdef" })

    expect(res.status).toBe(400)
  })

  it("should invalidate OTP after successful verification (no reuse)", async () => {
    await request(getApp())
      .post("/api/v1/auth/signup")
      .send(validSignup)

    await request(getApp())
      .post("/api/v1/auth/send-otp")
      .send({ email: validSignup.email })

    // First verification succeeds
    await request(getApp())
      .post("/api/v1/auth/verify-otp")
      .send({ email: validSignup.email, otp: FIXED_OTP })

    // Second attempt with same OTP should fail
    const res = await request(getApp())
      .post("/api/v1/auth/verify-otp")
      .send({ email: validSignup.email, otp: FIXED_OTP })

    expect(res.status).toBe(400)
  })
})
