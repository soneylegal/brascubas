import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function createAuthToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, env.JWT_SECRET) as { userId?: string };
  if (!decoded.userId) {
    throw new Error("Token sem userId");
  }

  return { userId: decoded.userId };
}
