"use server";
import { randomUUID } from "node:crypto";

// ref: https://github.com/vercel/next.js/issues/82029
// export type { UUID } from "node:crypto";
export type UUID = `${string}-${string}-${string}-${string}-${string}`;

export const generateUUID = async () => randomUUID();
