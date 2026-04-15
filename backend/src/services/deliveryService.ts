import { MemoryModel, type MemoryDocument } from "../models/Memory.js";

type DeliveryLogMemory = {
  _id: unknown;
  title: string;
  recipient: string;
};

export function isMemoryDeliverable(memory: Pick<MemoryDocument, "deliveryMode" | "deliverAt" | "eventName" | "deliveredAt">, now: Date, eventName?: string): boolean {
  if (memory.deliveredAt) {
    return false;
  }

  if (memory.deliveryMode === "date") {
    return Boolean(memory.deliverAt && memory.deliverAt <= now);
  }

  if (memory.deliveryMode === "event") {
    return Boolean(eventName && memory.eventName === eventName);
  }

  return false;
}

export async function releaseDueMemories(ownerId: string, now: Date): Promise<number> {
  const dueMemories = (await MemoryModel.find({
    ownerId,
    deliveryMode: "date",
    deliveredAt: { $exists: false },
    deliverAt: { $lte: now }
  }).select("_id title recipient")) as unknown as DeliveryLogMemory[];

  if (dueMemories.length === 0) {
    return 0;
  }

  await MemoryModel.updateMany(
    { _id: { $in: dueMemories.map((memory: DeliveryLogMemory) => memory._id) } },
    { $set: { deliveredAt: now } }
  );

  dueMemories.forEach((memory: DeliveryLogMemory) => {
    console.log(`[ENTREGA] Memória '${memory.title}' liberada para ${memory.recipient}`);
  });

  return dueMemories.length;
}

export async function releaseEventMemories(ownerId: string, eventName: string, now: Date): Promise<number> {
  const eventMemories = (await MemoryModel.find({
    ownerId,
    deliveryMode: "event",
    eventName,
    deliveredAt: { $exists: false }
  }).select("_id title recipient")) as unknown as DeliveryLogMemory[];

  if (eventMemories.length === 0) {
    return 0;
  }

  await MemoryModel.updateMany(
    { _id: { $in: eventMemories.map((memory: DeliveryLogMemory) => memory._id) } },
    { $set: { deliveredAt: now } }
  );

  eventMemories.forEach((memory: DeliveryLogMemory) => {
    console.log(`[ENTREGA EVENTO] Memória '${memory.title}' liberada para ${memory.recipient}`);
  });

  return eventMemories.length;
}
