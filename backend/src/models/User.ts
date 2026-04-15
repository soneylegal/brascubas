import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    vaultSalt: { type: String, required: true },
    status: {
      type: String,
      enum: ["alive", "deceased"],
      default: "alive"
    },
    verificationMode: {
      type: String,
      enum: ["checkin", "external_api"],
      default: "checkin"
    },
    lastCheckInAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: string };

export const UserModel = model("User", userSchema);
