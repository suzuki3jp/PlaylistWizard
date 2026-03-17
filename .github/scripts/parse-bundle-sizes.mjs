#!/usr/bin/env node
/**
 * Parse Next.js bundle analysis .data files and output a JSON summary.
 *
 * Usage:
 *   node parse-bundle-sizes.mjs <analyze-dir>
 *   # e.g. node parse-bundle-sizes.mjs app/.next/diagnostics/analyze
 *
 * Output (stdout):
 *   {
 *     "routes": {
 *       "/[lang]": { "clientJs": 12345, "clientJsGzip": 4567 },
 *       ...
 *     }
 *   }
 *
 * ---------------------------------------------------------------------------
 * NOTICE: The binary parsing logic below is adapted from:
 *   apps/bundle-analyzer/lib/analyze-data.ts
 *   in the vercel/next.js repository.
 *
 *   MIT License
 *   Copyright (c) 2016-present Vercel, Inc.
 *   https://github.com/vercel/next.js/blob/5809756f5599f9cd5fd8396b44eb7a4d9668479e/apps/bundle-analyzer/lib/analyze-data.ts
 * ---------------------------------------------------------------------------
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const analyzeDir = process.argv[2];
if (!analyzeDir) {
  process.stderr.write("Usage: parse-bundle-sizes.mjs <analyze-dir>\n");
  process.exit(1);
}

/**
 * Parse a .data file (analyze.data).
 *
 * Binary format:
 *   [4 bytes: big-endian uint32 = JSON byte length]
 *   [N bytes: UTF-8 JSON]
 *   [remaining: binary edges section]
 *
 * JSON header keys:
 *   sources          AnalyzeSource[]      - { parent_source_index: number|null, path: string }
 *   chunk_parts      AnalyzeChunkPart[]   - { source_index, output_file_index, size, compressed_size }
 *   output_files     AnalyzeOutputFile[]  - { filename: string }
 *   output_file_chunk_parts / source_chunk_parts / source_children  - EdgesDataReference
 *   source_roots     number[]
 */
function parseAnalyzeData(filePath) {
  const buf = readFileSync(filePath);
  // Buffer.slice copies bytes into a new ArrayBuffer (safe for DataView offset math)
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const dataView = new DataView(ab);

  const jsonLength = dataView.getUint32(0, false); // big-endian
  const jsonBytes = new Uint8Array(ab, 4, jsonLength);
  const header = JSON.parse(new TextDecoder("utf-8").decode(jsonBytes));

  return header;
}

/**
 * Sum client-side JS sizes for a route by iterating over chunk_parts
 * and filtering output files to those under [client-fs]/ with .js extension.
 *
 * chunk_parts partition output files by source, so summing them gives
 * the correct total without double-counting.
 */
function getClientJsSizes(header) {
  // Deduplicate by output_file_index to avoid counting the same file twice
  // when multiple sources contribute to the same output file.
  // (chunk_parts.size values for a given output_file_index sum to that file's total size)
  const seen = new Set();
  let size = 0;
  let compressedSize = 0;

  for (const part of header.chunk_parts) {
    const outputFile = header.output_files[part.output_file_index];
    if (!outputFile) continue;

    const filename = outputFile.filename;
    if (!filename.startsWith("[client-fs]/") || !filename.endsWith(".js"))
      continue;
    if (seen.has(part.output_file_index)) continue;
    seen.add(part.output_file_index);

    // Sum all chunk_parts for this output file
    let fileSize = 0;
    let fileCompressedSize = 0;
    for (const p of header.chunk_parts) {
      if (p.output_file_index === part.output_file_index) {
        fileSize += p.size;
        fileCompressedSize += p.compressed_size;
      }
    }
    size += fileSize;
    compressedSize += fileCompressedSize;
  }

  return { size, compressedSize };
}

// ── Main ────────────────────────────────────────────────────────────────────

const routesPath = join(analyzeDir, "data", "routes.json");
const routes = JSON.parse(readFileSync(routesPath, "utf-8"));

const result = { routes: {} };

for (const route of routes) {
  // "/" → "analyze.data", "/[lang]" → "[lang]/analyze.data"
  const routeRelPath =
    route === "/" ? "analyze.data" : `${route.replace(/^\//, "")}/analyze.data`;
  const dataFilePath = join(analyzeDir, "data", routeRelPath);

  try {
    const header = parseAnalyzeData(dataFilePath);
    const { size, compressedSize } = getClientJsSizes(header);
    result.routes[route] = { clientJs: size, clientJsGzip: compressedSize };
  } catch {
    // Route may not have analyze data (e.g. API routes)
    result.routes[route] = null;
  }
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
