import { hasDependencyCycle, hasInvalidDependencies } from "./graph";
import {
  type StructuredPlaylistsDefinition,
  StructuredPlaylistsDefinitionSchema,
} from "./schema";

/**
 * Parses untrusted input into a Structured Playlists Definition that satisfies
 * both the JSON shape and the Dependency graph rules. Server-side consumers use
 * this as the single acceptance gate so the product rules are not re-implemented
 * per transport. Returns null when the input is not an acceptable Definition.
 */
export function parseStructuredPlaylistsDefinition(
  input: unknown,
): StructuredPlaylistsDefinition | null {
  const parsed = StructuredPlaylistsDefinitionSchema.safeParse(input);
  if (!parsed.success) return null;
  if (hasDependencyCycle(parsed.data)) return null;
  if (hasInvalidDependencies(parsed.data)) return null;
  return parsed.data;
}
