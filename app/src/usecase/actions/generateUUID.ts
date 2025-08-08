"use server";

import { type UUID as _UUID, randomUUID } from "node:crypto";

// ref: https://github.com/vercel/next.js/issues/82029
// export type { UUID } from "node:crypto";
export type UUID = _UUID;

export const generateUUID = async () => randomUUID();
