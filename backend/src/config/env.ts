import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  CHECKIN_GRACE_HOURS: z.coerce.number().default(72),
  EXTERNAL_LIFE_API_URL: z.string().optional().default("")
});

export const env = envSchema.parse(process.env);
