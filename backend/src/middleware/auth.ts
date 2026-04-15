import type { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "../services/authService.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token ausente" });
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const payload = verifyAuthToken(token);
    req.auth = { userId: payload.userId };
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}
