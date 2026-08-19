import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { users } from "../db/schema.js";

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },

    async (email, password, done) => {
      try {
        const result = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        const user = result[0];

        if (!user) {
          return done(null, false, {
            message: "Invalid email or password",
          });
        }
       console.log("Stored hash:", user.passwordHash);
        const validPassword = await bcrypt.compare(
          password,
          user.passwordHash,
        );
        console.log("Password valid:", validPassword);

        if (!validPassword) {
          return done(null, false, {
            message: "Invalid email or password",
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

export default passport;