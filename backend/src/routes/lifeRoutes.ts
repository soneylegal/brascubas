import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { UserModel } from "../models/User.js";
import { releaseDueMemories } from "../services/deliveryService.js";
import { isCheckInExpired, verifyWithExternalApi } from "../services/lifeVerificationService.js";

export const lifeRoutes = Router();

lifeRoutes.use(requireAuth);

lifeRoutes.post("/check-in", async (req, res) => {
  const user = await UserModel.findByIdAndUpdate(
    req.auth!.userId,
    { $set: { lastCheckInAt: new Date(), status: "alive" } },
    { new: true }
  );

  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  res.json({ message: "Check-in realizado", lastCheckInAt: user.lastCheckInAt });
});

lifeRoutes.post("/verify-now", async (req, res) => {
  const user = await UserModel.findById(req.auth!.userId);
  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  let isAlive = true;

  if (user.verificationMode === "checkin") {
    isAlive = !isCheckInExpired(user.lastCheckInAt);
  } else {
    isAlive = await verifyWithExternalApi(user.email);
  }

  user.status = isAlive ? "alive" : "deceased";
  await user.save();

  if (!isAlive) {
    const delivered = await releaseDueMemories(String(user._id), new Date());
    res.json({ status: user.status, delivered, message: "Usuário marcado como falecido" });
    return;
  }

  res.json({ status: user.status, delivered: 0 });
});
