import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { query } from "../db.js";
import { validate } from "../middleware/validate.js";
import { loginSchema } from "../schemas.js";

export const authRouter = express.Router();

authRouter.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await query(
      "select id, email, password_hash, role from admin_users where email = $1",
      [email.toLowerCase()]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    return next(error);
  }
});
