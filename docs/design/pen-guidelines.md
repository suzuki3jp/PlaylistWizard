# `.pen` File Editing Guidelines

Guidelines and tips for working with `.pen` files using the Pencil MCP tools.

## Key Constraints

### Reusable Components Must Be at Document Root

Components (`reusable: true`) **must** be created at the document root level using `I(document, {...})`. Setting `reusable: true` on a node nested inside another frame will silently fail.

```javascript
// Correct - component at document root
comp=I(document, {type: "frame", name: "Component/Foo", reusable: true, ...})

// Wrong - nested node cannot be made reusable
U("nestedNodeId", {reusable: true})  // silently fails
```

### Creating Reusable Components

The `reusable: true` property must be set at **Insert time**. It cannot be reliably set later via Update, nor applied through Copy.

```javascript
// Correct - set reusable at creation
comp=I(document, {type: "frame", reusable: true, placeholder: true, ...})

// Unreliable - these approaches may silently fail
U("existingNode", {reusable: true})
C("sourceNode", document, {reusable: true})
```

### Creating Component Instances (ref)

To create a connected instance of a reusable component, use `I()` with `type: "ref"`:

```javascript
instance=I("parentFrame", {type: "ref", ref: "componentId", name: "Instance Name"})
```

To override descendant properties, use `U()` with path notation after insertion:

```javascript
instance=I("parentFrame", {type: "ref", ref: "componentId"})
U(instance+"/textNodeId", {content: "Overridden text"})
```

### Image Fills

There is **no `image` node type**. Images are applied as fills on `frame` or `rectangle` nodes.

```javascript
// Using a local file (relative path from the .pen file)
imgFrame=I("parent", {
  type: "frame",
  width: 100,
  height: 100,
  fill: {type: "image", url: "./relative/path/to/image.png", mode: "fill"}
})

// Using AI-generated or stock image
frame=I("parent", {type: "frame", width: 400, height: 300})
G(frame, "ai", "description of the image")
G(frame, "stock", "search keywords")
```

### Placeholder Workflow

When creating or modifying frames, always use the placeholder pattern:

1. Set `placeholder: true` when starting work on a frame
2. Add/modify children
3. Set `placeholder: false` when done

```javascript
// Step 1: Create with placeholder
container=I(document, {type: "frame", placeholder: true, ...})

// Step 2: Add children (in subsequent batch_design calls)
child=I("containerId", {type: "text", content: "Hello"})

// Step 3: Remove placeholder when done
U("containerId", {placeholder: false})
```

### Copy Limitations

When copying nodes with `C()`, descendant nodes get **new IDs**. Do not use `U()` on descendants of a just-copied node - the original IDs no longer exist. Instead, use the `descendants` property within the Copy operation itself:

```javascript
// Correct
copy=C("sourceId", "parent", {descendants: {"childId": {content: "New text"}}})

// Wrong - childId has a new ID after copy
copy=C("sourceId", "parent", {})
U(copy+"/childId", {content: "New text"})  // fails
```

### Move Requires Real Node IDs

The `M()` operation does not accept binding names. Use it in a separate `batch_design` call after the node has been created:

```javascript
// batch_design call 1: create the node
node=I("parent", {type: "frame", ...})

// batch_design call 2: move it (use the real ID from the result)
M("realNodeId", "newParent", 0)
```

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Reusable components | `Component/{Name}` | `Component/Header`, `Component/Logo` |
| Page frames | `PlaylistWizard Home`, `PlaylistWizard Home (JA)` | - |
| Sections | Descriptive name | `Hero Section`, `Features Section` |
| Overridable text nodes | camelCase with semantic prefix | `navFeatures`, `ctaText`, `faqQ1` |

## Localization (i18n) Pattern

For multi-locale designs:

1. Create the component with English text as default
2. Create ref instances for each page
3. Override text nodes with locale-specific content using `U(instanceId+"/textNodeId", {content: "..."})`

This keeps a single source of truth for layout/styling while allowing text customization per locale.

## Batch Design Tips

- Keep each `batch_design` call to **max 25 operations**
- Split large designs into logical sections across multiple calls
- Always verify changes with `get_screenshot` after modifications
- Use `snapshot_layout` to check positioning before inserting new content
