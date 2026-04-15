import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { UserModel } from "../models/User.js";
import { createAuthToken } from "../services/authService.js";
import { generateVaultSalt } from "../services/cryptoService.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  verificationMode: z.enum(["checkin", "external_api"]).optional().default("checkin")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const authRoutes = Router();

authRoutes.post("/register", async (req, res) => {
  const payload = registerSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ error: payload.error.flatten() });
    return;
  }

  const exists = await UserModel.findOne({ email: payload.data.email });
  if (exists) {
    res.status(409).json({ error: "Email já cadastrado" });
    return;
  }

  const passwordHash = await bcrypt.hash(payload.data.password, 12);
  const vaultSalt = await generateVaultSalt();

  const user = await UserModel.create({
    email: payload.data.email,
    passwordHash,
    vaultSalt,
    verificationMode: payload.data.verificationMode
  });

  const token = createAuthToken(String(user._id));
  res.status(201).json({ token, user: { id: user._id, email: user.email } });
});

authRoutes.post("/login", async (req, res) => {
  const payload = loginSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ error: payload.error.flatten() });
    return;
  }

  const user = await UserModel.findOne({ email: payload.data.email });
  if (!user) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  const valid = await bcrypt.compare(payload.data.password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  const token = createAuthToken(String(user._id));
  res.json({ token, user: { id: user._id, email: user.email, status: user.status } });
});
