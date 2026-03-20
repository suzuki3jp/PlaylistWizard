# Pencil Design Tool Rules for Claude Code

## Working with .pen Files

### Important Constraints

- Do NOT edit .pen files directly
- Always use Pencil MCP tools (`batch_get`, `batch_design`, etc.)
- Store design files under the `designs/` directory

### Getting Started

#### Before Starting Work

1. Check the target design file
   - Use `get_editor_state()` to check the current editor state
   - Identify the active .pen file and current user selection
   - Verify whether the specified design file exists
2. If the design file does not exist
   - Create the appropriate folder structure under `designs/`
   - Use a file name matching the design type (e.g., `designs/{design-type}.pen` such as `designs/login-page.pen`)
   - Create the new .pen file using Pencil MCP tools

#### Directory Structure

```
designs/
├── README.md          # Design guidelines (this file)
├── *.pen              # Pencil design files
├── images/            # Image files (referenced via relative paths)
└── codes/             # Generated code
    └── components/    # React components
```

### Handling Image Files

#### Key Principles

- Pencil stores image paths as references in JSON
- Image files must be placed under the `designs/images/` directory
- Always use relative paths in JSON references

#### Steps to Add an Image

1. Place the image file
   - Copy the image file to the `designs/images/` directory
   - Use descriptive file names (e.g., `button-icon.png`)
2. Reference from Pencil
   - Use Pencil MCP tools to create the image node
   - Specify the image path as a relative path (e.g., `images/button-icon.png`)
   - Do NOT use absolute paths
