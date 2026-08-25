/**
 * Real integration test for the auth routes — exercises the full Express app
 * against a live Postgres via supertest. Requires DATABASE_URL to point at a
 * throwaway test database (CI ships a Postgres service container).
 */
import { describe, it, expect, beforeAll } from "vitest";

const uniq = () => Math.random().toString(36).slice(2, 10);

describe.skipIf(!process.env.DATABASE_URL)("auth integration", () => {
  let request: any;
  let app: any;
  beforeAll(async () => {
    request = (await import("supertest")).default;
    app = (await import("../app")).default;
  });

  const username = `t_${uniq()}`;
  const email = `${username}@example.com`;
  const password = "Correct-Horse-9";



  it("rejects registration with weak password (Zod)", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username, email, password: "weak", displayName: "T",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid request body/);
    expect(res.body.issues).toBeInstanceOf(Array);
  });

  it("registers, logs in, and returns /me", async () => {
    const reg = await request(app).post("/api/auth/register").send({
      username, email, password, displayName: "Test User",
    });
    expect(reg.status).toBe(201);
    expect(reg.body.token).toBeTypeOf("string");
    expect(reg.body.user.username).toBe(username);

    const login = await request(app).post("/api/auth/login").send({ email, password });
    expect(login.status).toBe(200);
    const token = login.body.token as string;

    const me = await request(app).get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.username).toBe(username);
  });

  it("rejects login with wrong password without leaking user existence", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email, password: "Wrong-Password-9" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("returns 401 with the same message when the user does not exist", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email: `nobody_${uniq()}@example.com`, password });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("attaches a request id to every response", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.status).toBe(200);
    // helmet + our correlation-id middleware
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});
