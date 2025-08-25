import { NextResponse } from "next/server";
import { z } from "zod";

import { StructuredPlaylistsDefinitionSchema } from "@/repository/structured-playlists/schema";

export function GET() {
  const schema = z.toJSONSchema(StructuredPlaylistsDefinitionSchema);
  return NextResponse.json(schema);
}
