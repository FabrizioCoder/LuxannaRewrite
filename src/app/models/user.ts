import { Schema, model } from "mongoose";

interface userSchemaI {
  id: string;
  gameName: string;
  tagLine: string;
  puuid: string;
  region: string;
}

const userSchema = new Schema<userSchemaI>({
  id: { type: String, required: true },
  gameName: { type: String, required: true },
  tagLine: { type: String, required: true },
  puuid: { type: String, required: true },
  region: { type: String, required: true },
});

export const userModel = model<userSchemaI>("user", userSchema);
