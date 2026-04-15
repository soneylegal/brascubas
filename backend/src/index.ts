import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { authRoutes } from "./routes/authRoutes.js";
import { memoryRoutes } from "./routes/memoryRoutes.js";
import { lifeRoutes } from "./routes/lifeRoutes.js";
import { UserModel } from "./models/User.js";
import { releaseDueMemories } from "./services/deliveryService.js";
import { isCheckInExpired, verifyWithExternalApi } from "./services/lifeVerificationService.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.use("/auth", authRoutes);
app.use("/memories", memoryRoutes);
app.use("/life", lifeRoutes);

async function runScheduledLifeVerification(): Promise<void> {
  const users = await UserModel.find({ status: "alive" });
  const now = new Date();

  for (const user of users) {
    let shouldMarkDeceased = false;

    if (user.verificationMode === "checkin") {
      shouldMarkDeceased = isCheckInExpired(user.lastCheckInAt, now);
    } else {
      shouldMarkDeceased = !(await verifyWithExternalApi(user.email));
    }

    if (shouldMarkDeceased) {
      user.status = "deceased";
      await user.save();
      const delivered = await releaseDueMemories(String(user._id), now);
      console.log(`[LIFE] ${user.email} marcado como falecido. Entregas: ${delivered}`);
    }
  }
}

async function bootstrap(): Promise<void> {
  await connectDatabase(env.MONGODB_URI);

  setInterval(() => {
    void runScheduledLifeVerification();
  }, 60_000);

  app.listen(env.PORT, () => {
    console.log(`API online na porta ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Falha ao iniciar aplicação", error);
  process.exit(1);
});
