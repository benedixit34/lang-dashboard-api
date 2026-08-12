import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import bcrypt from "bcrypt";
import passport from "passport";

import { db } from "../src/db/index.js";

import {
  registerController,
  loginController,
} from "../src/controllers/auth.controller.js";

import authRouter from "../src/routes/auth.routes.js";

/* -------------------------------------------------------------------------- */
/*                                   MOCKS                                    */
/* -------------------------------------------------------------------------- */

jest.mock("../src/db/index.js", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

jest.mock("bcrypt", () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
  },
}));

jest.mock("passport", () => ({
  __esModule: true,
  default: {
    authenticate: jest.fn(),
  },
}));

/* -------------------------------------------------------------------------- */
/*                              MOCK REFERENCES                               */
/* -------------------------------------------------------------------------- */

const mockedDb = db as any;
const mockedBcrypt = bcrypt as any;
const mockedPassport = passport as any;

/* -------------------------------------------------------------------------- */
/*                              HELPER FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

function makeSelectBuilder(rows: any[]): any {
  const limit = jest.fn() as any;

  limit.mockResolvedValue(rows);

  return {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit,
  };
}

function makeInsertBuilder(rows: any[]): any {
  const returning = jest.fn() as any;

  returning.mockResolvedValue(rows);

  return {
    values: jest.fn().mockReturnThis(),
    returning,
  };
}

function makeResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as any;
}

/* -------------------------------------------------------------------------- */
/*                         PASSPORT MOCK HELPERS                              */
/* -------------------------------------------------------------------------- */

function mockPassportSuccess() {
  mockedPassport.authenticate.mockImplementation(
    (_strategy: any, _options: any, callback: any) => {
      return (_req: any, _res: any, _next: any) => {
        callback(null, {
          id: 1,
          email: "user@example.com",
          name: "Ada",
          role: "user",
        });
      };
    },
  );
}

function mockPassportFailure() {
  mockedPassport.authenticate.mockImplementation(
    (_strategy: any, _options: any, callback: any) => {
      return (_req: any, _res: any, _next: any) => {
        callback(null, false, {
          message: "Invalid email or password",
        });
      };
    },
  );
}

/* -------------------------------------------------------------------------- */
/*                             CONTROLLER TESTS                               */
/* -------------------------------------------------------------------------- */

describe("auth controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.JWT_SECRET = "test-secret";

    mockedBcrypt.hash.mockImplementation(
      async () => "hashed-password",
    );

    mockedDb.select.mockReturnValue(
      makeSelectBuilder([]),
    );

    mockedDb.insert.mockReturnValue(
      makeInsertBuilder([
        {
          id: 1,
          email: "user@example.com",
          name: "Ada",
          role: "user",
          createdAt: new Date(
            "2024-01-01T00:00:00.000Z",
          ),
        },
      ]),
    );

    mockPassportSuccess();
  });

  it("returns 400 when register payload is missing email or password", async () => {
    const req = {
      body: {
        name: "Ada",
      },
    } as any;

    const res = makeResponse();
    const next = jest.fn();

    await registerController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Email and password are required",
    });
  });

  it("returns 409 when the email is already registered", async () => {
    mockedDb.select.mockReturnValue(
      makeSelectBuilder([{ id: 42 }]),
    );

    const req = {
      body: {
        email: "existing@example.com",
        password: "secret123",
        name: "Ada",
      },
    } as any;

    const res = makeResponse();
    const next = jest.fn();

    await registerController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "An account with this email already exists",
    });
  });

  it("creates a user and returns a 201 response", async () => {
    const req = {
      body: {
        email: "user@example.com",
        password: "secret123",
        name: "Ada",
      },
    } as any;

    const res = makeResponse();
    const next = jest.fn();

    await registerController(req, res, next);

    expect(mockedBcrypt.hash).toHaveBeenCalledWith(
      "secret123",
      12,
    );

    expect(mockedDb.insert).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Account created successfully",
        data: expect.objectContaining({
          user: expect.objectContaining({
            email: "user@example.com",
            name: "Ada",
            role: "user",
          }),
        }),
      }),
    );
  });

  it("returns 401 when login credentials are invalid", async () => {
    mockPassportFailure();

    const req = {
      body: {
        email: "wrong@example.com",
        password: "bad-password",
      },
    } as any;

    const res = makeResponse();
    const next = jest.fn();

    await loginController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid email or password",
    });
  });

  it("returns a token and user payload when login succeeds", async () => {
    mockPassportSuccess();

    const req = {
      body: {
        email: "user@example.com",
        password: "secret123",
      },
    } as any;

    const res = makeResponse();
    const next = jest.fn();

    await loginController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Login successful",
        data: expect.objectContaining({
          user: expect.objectContaining({
            id: 1,
            email: "user@example.com",
            name: "Ada",
            role: "user",
          }),
          token: expect.any(String),
        }),
      }),
    );
  });

});

/* -------------------------------------------------------------------------- */
/*                               ROUTE TESTS                                  */
/* -------------------------------------------------------------------------- */

describe("auth routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.JWT_SECRET = "test-secret";

    mockedBcrypt.hash.mockImplementation(
      async () => "hashed-password",
    );

    mockedDb.select.mockReturnValue(
      makeSelectBuilder([]),
    );

    mockedDb.insert.mockReturnValue(
      makeInsertBuilder([
        {
          id: 1,
          email: "user@example.com",
          name: "Ada",
          role: "user",
          createdAt: new Date(
            "2024-01-01T00:00:00.000Z",
          ),
        },
      ]),
    );

    mockPassportSuccess();
  });

  function createApp() {
    const app = express();

    app.use(express.json());

    app.use("/auth", authRouter);

    return app;
  }

  it("registers a new user through /auth/register", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/auth/register")
      .send({
        email: "user@example.com",
        password: "secret123",
        name: "Ada",
      });

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data.user.email).toBe(
      "user@example.com",
    );
  });

  it("logs in a user through /auth/login", async () => {
    mockPassportSuccess();

    const app = createApp();

    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "user@example.com",
        password: "secret123",
      });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.user.email).toBe(
      "user@example.com",
    );

    expect(response.body.data.token).toEqual(
      expect.any(String),
    );
  });

  it("logs out a user through /auth/logout", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/auth/logout");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "Logout successful",
    });
  });
});