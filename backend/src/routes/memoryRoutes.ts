import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { MemoryModel } from "../models/Memory.js";
import { UserModel } from "../models/User.js";
import {
  decryptVaultContent,
  deriveVaultKey,
  encryptVaultContent
} from "../services/cryptoService.js";
import { releaseEventMemories } from "../services/deliveryService.js";

const createMemorySchema = z
  .object({
    title: z.string().min(1),
    type: z.enum(["mensagem", "carta", "video", "recomendacao"]),
    content: z.string().min(1),
    recipient: z.string().min(3),
    vaultPassword: z.string().min(8),
    deliveryMode: z.enum(["date", "event"]),
    deliverAt: z.string().datetime().optional(),
    eventName: z.string().min(2).optional()
  })
  .refine((data) => data.deliveryMode === "date" ? Boolean(data.deliverAt) : Boolean(data.eventName), {
    message: "Para date use deliverAt; para event use eventName"
  });

const revealSchema = z.object({
  vaultPassword: z.string().min(8)
});

const triggerEventSchema = z.object({
  eventName: z.string().min(2)
});

export const memoryRoutes = Router();

memoryRoutes.use(requireAuth);

memoryRoutes.post("/", async (req, res) => {
  const payload = createMemorySchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ error: payload.error.flatten() });
    return;
  }

  const userId = req.auth!.userId;
  const user = await UserModel.findById(userId);
  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  const vaultKey = await deriveVaultKey(payload.data.vaultPassword, user.vaultSalt);
  const encrypted = await encryptVaultContent(payload.data.content, vaultKey);

  const memory = await MemoryModel.create({
    ownerId: userId,
    title: payload.data.title,
    type: payload.data.type,
    encryptedPayload: encrypted.cipher,
    nonce: encrypted.nonce,
    recipient: payload.data.recipient,
    deliveryMode: payload.data.deliveryMode,
    deliverAt: payload.data.deliverAt ? new Date(payload.data.deliverAt) : undefined,
    eventName: payload.data.eventName
  });

  res.status(201).json({
    id: memory._id,
    title: memory.title,
    type: memory.type,
    deliveryMode: memory.deliveryMode
  });
});

memoryRoutes.get("/", async (req, res) => {
  const userId = req.auth!.userId;
  const memories = await MemoryModel.find({ ownerId: userId }).sort({ createdAt: -1 });

  res.json(
    memories.map((memory) => ({
      id: memory._id,
      title: memory.title,
      type: memory.type,
      deliveryMode: memory.deliveryMode,
      deliverAt: memory.deliverAt,
      eventName: memory.eventName,
      recipient: memory.recipient,
      deliveredAt: memory.deliveredAt
    }))
  );
});

memoryRoutes.post("/:id/reveal", async (req, res) => {
  const payload = revealSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ error: payload.error.flatten() });
    return;
  }

  const userId = req.auth!.userId;
  const [memory, user] = await Promise.all([
    MemoryModel.findOne({ _id: req.params.id, ownerId: userId }),
    UserModel.findById(userId)
  ]);

  if (!memory || !user) {
    res.status(404).json({ error: "Memória não encontrada" });
    return;
  }

  try {
    const key = await deriveVaultKey(payload.data.vaultPassword, user.vaultSalt);
    const content = await decryptVaultContent(memory.encryptedPayload, memory.nonce, key);
    res.json({ id: memory._id, title: memory.title, content });
  } catch {
    res.status(401).json({ error: "Senha do cofre inválida" });
  }
});

memoryRoutes.post("/events/trigger", async (req, res) => {
  const payload = triggerEventSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ error: payload.error.flatten() });
    return;
  }

  const released = await releaseEventMemories(req.auth!.userId, payload.data.eventName, new Date());

  res.json({ released, message: `${released} memória(s) liberada(s)` });
});
