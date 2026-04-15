import { env } from "../config/env.js";

export function isCheckInExpired(lastCheckInAt: Date, now = new Date()): boolean {
  const graceMs = env.CHECKIN_GRACE_HOURS * 60 * 60 * 1000;
  return now.getTime() - lastCheckInAt.getTime() > graceMs;
}

export async function verifyWithExternalApi(email: string): Promise<boolean> {
  if (!env.EXTERNAL_LIFE_API_URL) {
    return false;
  }

  try {
    const response = await fetch(env.EXTERNAL_LIFE_API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as { isAlive?: boolean };
    return payload.isAlive === true;
  } catch {
    return false;
  }
}
