import { describe, expect, it } from "vitest";
import { isMemoryDeliverable } from "../src/services/deliveryService.js";

describe("isMemoryDeliverable", () => {
  it("entrega memória por data quando vencida", () => {
    const now = new Date("2026-01-10T10:00:00.000Z");
    const memory = {
      deliveryMode: "date",
      deliverAt: new Date("2026-01-09T10:00:00.000Z"),
      eventName: undefined,
      deliveredAt: undefined
    } as const;

    expect(isMemoryDeliverable(memory, now)).toBe(true);
  });

  it("não entrega por evento quando evento não corresponde", () => {
    const memory = {
      deliveryMode: "event",
      deliverAt: undefined,
      eventName: "obito_confirmado",
      deliveredAt: undefined
    } as const;

    expect(isMemoryDeliverable(memory, new Date(), "outro_evento")).toBe(false);
  });
});
