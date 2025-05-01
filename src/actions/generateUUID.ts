"use server";
export type { UUID } from "node:crypto";
import { randomUUID } from "node:crypto";

export const generateUUID = async () => randomUUID();
