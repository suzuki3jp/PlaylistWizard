const path = require("node:path");

const API_SRC_PARTS = ["apps", "api", "src"];
const ADR_PATH = "docs/adr/0005-layer-first-api-architecture.md";

const BRANDED_ID_IMPORTS = new Map([
  [
    "@playlistwizard/core",
    new Set([
      "toAccountId",
      "toPlaylistId",
      "toPlaylistItemId",
      "toProviderAccountId",
      "toUserId",
      "toVideoId",
    ]),
  ],
  [
    "@playlistwizard/core/ids",
    new Set([
      "toAccountId",
      "toPlaylistId",
      "toPlaylistItemId",
      "toProviderAccountId",
      "toUserId",
      "toVideoId",
    ]),
  ],
  ["@playlistwizard/playlist-action-job", new Set(["toJobId", "toStepId"])],
  ["@playlistwizard/playlist-action-job/job", new Set(["toJobId"])],
  ["@playlistwizard/playlist-action-job/step", new Set(["toStepId"])],
]);

const ALLOWED_LAYER_IMPORTS = {
  composition: new Set([
    "composition",
    "env",
    "infrastructure",
    "shared",
    "usecase",
  ]),
  entrypoint: new Set(["entrypoint", "env", "presentation"]),
  env: new Set(["env"]),
  infrastructure: new Set(["env", "infrastructure", "shared", "usecase"]),
  presentation: new Set([
    "composition",
    "env",
    "presentation",
    "shared",
    "usecase",
  ]),
  shared: new Set(["env", "shared"]),
  usecase: new Set(["shared", "usecase"]),
};

/**
 * Returns the absolute API src directory for a linted file, or null outside
 * `apps/api/src`. The custom rules stay inert for other workspaces.
 */
const getApiSrcRoot = (filename) => {
  const parts = path.normalize(filename).split(path.sep);
  for (let index = 0; index <= parts.length - API_SRC_PARTS.length; index++) {
    if (API_SRC_PARTS.every((part, offset) => parts[index + offset] === part)) {
      return parts.slice(0, index + API_SRC_PARTS.length).join(path.sep);
    }
  }
  return null;
};

/**
 * Resolves local API import specifiers to absolute paths without requiring the
 * target file to exist. Layer checks only need the path shape.
 */
const resolveApiImport = (apiSrcRoot, importerFilename, specifier) => {
  if (specifier.startsWith("@/")) {
    return path.normalize(path.join(apiSrcRoot, specifier.slice(2)));
  }

  if (specifier.startsWith(".")) {
    return path.normalize(
      path.resolve(path.dirname(importerFilename), specifier),
    );
  }

  return null;
};

const getRelativeApiPath = (apiSrcRoot, filename) => {
  const normalized = path.normalize(filename);
  const relative = path.relative(apiSrcRoot, normalized);
  return relative.startsWith("..") || path.isAbsolute(relative)
    ? null
    : relative.split(path.sep).join("/");
};

const getLayer = (relativeApiPath) => {
  if (!relativeApiPath) return null;

  if (relativeApiPath === "app" || relativeApiPath === "app.ts") {
    return "entrypoint";
  }

  if (relativeApiPath === "index" || relativeApiPath === "index.ts") {
    return "entrypoint";
  }

  if (relativeApiPath === "env" || relativeApiPath === "env.ts") {
    return "env";
  }

  const [topLevel] = relativeApiPath.split("/");
  if (
    topLevel === "composition" ||
    topLevel === "infrastructure" ||
    topLevel === "presentation" ||
    topLevel === "shared" ||
    topLevel === "usecase"
  ) {
    return topLevel;
  }

  return null;
};

const getUsecaseFeature = (relativeApiPath) => {
  const parts = relativeApiPath.split("/");
  return parts[0] === "usecase" ? parts[1] : null;
};

const isTestFile = (filename) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(filename);

const getImportedName = (specifier) => {
  if (specifier.type !== "ImportSpecifier") return null;
  const imported = specifier.imported;
  return imported.type === "Identifier" ? imported.name : imported.value;
};

const isTypeOnlyImport = (node) => {
  if (node.importKind === "type") return true;
  if (node.specifiers.length === 0) return false;

  return node.specifiers.every(
    (specifier) =>
      specifier.type === "ImportSpecifier" && specifier.importKind === "type",
  );
};

/**
 * Returns true when an export-from declaration carries only type names.
 * Runtime layer checks must still inspect value re-exports because they can
 * leak concrete implementations through a barrel file.
 */
const isTypeOnlyExport = (node) => {
  if (node.exportKind === "type") return true;
  if (!node.specifiers || node.specifiers.length === 0) return false;

  return node.specifiers.every((specifier) => specifier.exportKind === "type");
};

/**
 * Import and export-from declarations are both module references. Keeping the
 * type-only check centralized prevents barrel exports from silently bypassing
 * the same layer rules that direct imports enforce.
 */
const isTypeOnlyModuleReference = (node) => {
  if (node.type === "ImportDeclaration") return isTypeOnlyImport(node);
  return isTypeOnlyExport(node);
};

const getStaticMemberName = (node) => {
  if (node.type !== "MemberExpression") return null;

  if (!node.computed && node.property.type === "Identifier") {
    return node.property.name;
  }

  if (
    node.computed &&
    node.property.type === "Literal" &&
    (typeof node.property.value === "string" ||
      typeof node.property.value === "number")
  ) {
    return String(node.property.value);
  }

  return null;
};

const layerImportMessage = ({ sourceLayer, targetLayer }) =>
  `API layer import violation: ${sourceLayer} must not import ${targetLayer}.
Why: apps/api keeps transport, composition, usecase, infrastructure, shared helpers, and environment types in one-way layers so concrete implementations cannot leak into inner policy.
ADR: ${ADR_PATH}
Fix: move the dependency in the allowed direction; if presentation needs infrastructure, construct it in composition and import the composed service/factory instead.`;

const typeOnlyUsecaseMessage = ({ sourceLayer }) =>
  `API layer import violation: ${sourceLayer} may import usecase contracts only as type-only imports.
Why: runtime usecase wiring belongs in composition; allowing value imports lets ${sourceLayer} bypass explicit port wiring.
ADR: ${ADR_PATH}
Fix: change this to \`import type\`, or move the runtime wiring into composition and depend on the composed service.`;

const crossUsecaseMessage = ({ sourceFeature, targetFeature }) =>
  `API layer import violation: usecase features must not import each other (${sourceFeature} -> ${targetFeature}).
Why: a usecase should model one user-visible application behavior and share behavior through local helpers or ports, not by calling another usecase as a shortcut.
ADR: ${ADR_PATH}
Fix: extract shared pure logic into the same feature helper or a package, or expose required behavior through an explicit port.`;

const brandedIdMessage = ({ name }) =>
  `Branded identifier conversion violation: ${name} may be used only in API presentation or infrastructure production code.
Why: to*Id functions bless raw strings as domain identifiers; keeping conversion at external boundaries makes it clear where HTTP, queue, auth, database, Provider API, and generated IDs become trusted typed values.
ADR: ${ADR_PATH}
Fix: convert the raw string at the presentation/infrastructure boundary, then pass the branded identifier into usecases through commands, ports, or records.`;

const apiLayerImportsRule = {
  meta: {
    type: "problem",
    docs: {
      description: "enforce one-way apps/api layer imports",
      url: ADR_PATH,
    },
  },
  create(context) {
    const apiSrcRoot = getApiSrcRoot(context.filename);
    const sourceRelativePath = apiSrcRoot
      ? getRelativeApiPath(apiSrcRoot, context.filename)
      : null;
    const sourceLayer = getLayer(sourceRelativePath);

    const checkModuleReference = (node) => {
      if (!apiSrcRoot || !sourceRelativePath || !sourceLayer) return;
      if (!node.source) return;

      const importPath = resolveApiImport(
        apiSrcRoot,
        context.filename,
        node.source.value,
      );
      const targetRelativePath = importPath
        ? getRelativeApiPath(apiSrcRoot, importPath)
        : null;
      const targetLayer = getLayer(targetRelativePath);
      if (!targetRelativePath || !targetLayer) return;

      if (!ALLOWED_LAYER_IMPORTS[sourceLayer]?.has(targetLayer)) {
        context.report({
          node,
          message: layerImportMessage({ sourceLayer, targetLayer }),
        });
        return;
      }

      if (
        (sourceLayer === "presentation" || sourceLayer === "infrastructure") &&
        targetLayer === "usecase" &&
        !isTypeOnlyModuleReference(node)
      ) {
        context.report({
          node,
          message: typeOnlyUsecaseMessage({ sourceLayer }),
        });
        return;
      }

      if (sourceLayer === "usecase" && targetLayer === "usecase") {
        const sourceFeature = getUsecaseFeature(sourceRelativePath);
        const targetFeature = getUsecaseFeature(targetRelativePath);
        if (sourceFeature !== targetFeature) {
          context.report({
            node,
            message: crossUsecaseMessage({ sourceFeature, targetFeature }),
          });
        }
      }
    };

    return {
      ImportDeclaration(node) {
        checkModuleReference(node);
      },
      ExportNamedDeclaration(node) {
        checkModuleReference(node);
      },
      ExportAllDeclaration(node) {
        checkModuleReference(node);
      },
    };
  },
};

const boundaryBrandedIdsRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "restrict branded ID conversion helpers to API external boundaries",
      url: ADR_PATH,
    },
  },
  create(context) {
    const apiSrcRoot = getApiSrcRoot(context.filename);
    const sourceRelativePath = apiSrcRoot
      ? getRelativeApiPath(apiSrcRoot, context.filename)
      : null;
    const sourceLayer = getLayer(sourceRelativePath);
    const bannedNamespaces = new Map();

    return {
      ImportDeclaration(node) {
        if (!apiSrcRoot || !sourceRelativePath || !sourceLayer) return;
        if (isTestFile(context.filename)) return;
        if (
          sourceLayer === "presentation" ||
          sourceLayer === "infrastructure"
        ) {
          return;
        }

        const bannedNames = BRANDED_ID_IMPORTS.get(node.source.value);
        if (!bannedNames) return;

        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportNamespaceSpecifier") {
            bannedNamespaces.set(specifier.local.name, bannedNames);
            continue;
          }

          const importedName = getImportedName(specifier);
          if (!importedName || !bannedNames.has(importedName)) continue;

          context.report({
            node: specifier,
            message: brandedIdMessage({ name: importedName, sourceLayer }),
          });
        }
      },
      CallExpression(node) {
        if (!apiSrcRoot || !sourceRelativePath || !sourceLayer) return;
        if (isTestFile(context.filename)) return;

        const callee = node.callee;
        if (
          callee.type !== "MemberExpression" ||
          callee.object.type !== "Identifier"
        ) {
          return;
        }

        const bannedNames = bannedNamespaces.get(callee.object.name);
        const memberName = bannedNames ? getStaticMemberName(callee) : null;
        if (!memberName || !bannedNames.has(memberName)) return;

        context.report({
          node: callee.property,
          message: brandedIdMessage({ name: memberName, sourceLayer }),
        });
      },
    };
  },
};

module.exports = {
  meta: {
    name: "playlistwizard-api",
  },
  rules: {
    "boundary-branded-ids": boundaryBrandedIdsRule,
    "layer-imports": apiLayerImportsRule,
  },
};
