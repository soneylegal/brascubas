import { Schema, model, type InferSchemaType } from "mongoose";

const memorySchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["mensagem", "carta", "video", "recomendacao"],
      required: true
    },
    encryptedPayload: { type: String, required: true },
    nonce: { type: String, required: true },
    deliveryMode: {
      type: String,
      enum: ["date", "event"],
      required: true
    },
    deliverAt: { type: Date },
    eventName: { type: String },
    recipient: { type: String, required: true },
    deliveredAt: { type: Date }
  },
  { timestamps: true }
);

memorySchema.index({ ownerId: 1, deliveryMode: 1, deliverAt: 1 });
memorySchema.index({ ownerId: 1, deliveryMode: 1, eventName: 1 });

export type MemoryDocument = InferSchemaType<typeof memorySchema> & { _id: string };

export const MemoryModel = model("Memory", memorySchema);
