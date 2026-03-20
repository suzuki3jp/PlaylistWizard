import { StructuredPlaylistsDefinitionSchema } from "@playlistwizard/core/structured-playlists";
import { NextResponse } from "next/server";
import { z } from "zod";

export function GET() {
  const schema = z.toJSONSchema(StructuredPlaylistsDefinitionSchema);
  return NextResponse.json(schema);
}
