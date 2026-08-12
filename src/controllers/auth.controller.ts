import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import passport from "passport";
import { eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { createAccessToken } from "../utils/jwt.js";

/**
 * Register a new regular user
 */
export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Check if email already exists
    const existingUser = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Never accept role from req.body.
    // Public registration always creates a regular user.
    const result = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name: name || null,
        role: "user",
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      });

    const user = result[0];

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login
 */
export function loginController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  passport.authenticate(
    "local",
    { session: false },
    (error: any, user: any, info: any) => {
      if (error) {
        return next(error);
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: info?.message || "Invalid email or password",
        });
      }

      const token = createAccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      });
    },
  )(req, res, next);
}