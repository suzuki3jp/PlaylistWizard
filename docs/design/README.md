# Design System (`app/designs/`)

This document describes the design file structure and working guidelines for the PlaylistWizard `.pen` design files.

## Overview

Design files are split per page under `app/designs/`:

| File | Contents |
|---|---|
| `home.pen` | Landing pages (EN/JA) |
| `login.pen` | Login page |

### Home Page Frames (`home.pen`)

| Frame | ID | Description |
|---|---|---|
| PlaylistWizard Home | `w046m` | English landing page |
| PlaylistWizard Home (JA) | `5UNCZ` | Japanese landing page |

### Login Page (`login.pen`)

| Frame | ID | Description |
|---|---|---|
| Login Page | `OmksS` | Sign-in page with Google/Spotify auth buttons |

## Page Structure

Each landing page uses a free-positioning layout (`layout: none`) with two direct children: a **Content** frame for page sections and a **SideMenu** overlay.

```
PlaylistWizard Home (frame, layout: none, 1440px)
  ├── Content (frame, layout: vertical, 1440px, x: 0, y: 0)
  │   ├── Header (hamburger + logo on left, "Get Started" on right)
  │   ├── Hero Section
  │   ├── Features Section
  │   ├── FAQ Section
  │   ├── Final CTA Section
  │   └── Footer
  └── SideMenu (x: 0, y: 0, overlaps Content)
```

| Page | Content ID | SideMenu ID |
|---|---|---|
| EN (`w046m`) | `tENYy` | `KToMW` |
| JA (`5UNCZ`) | `ewWz0` | `LJX7Q` |

### Content Sections

1. **Header** - Hamburger menu icon + logo on left, "Get Started" on right
2. **Hero Section** - Badge, headline, subtitle, CTA buttons, screenshot placeholder
3. **Features Section** - 6 feature cards in 2 rows of 3
4. **FAQ Section** - 5 FAQ items (first one expanded)
5. **Final CTA Section** - Headline, subtitle, CTA button
6. **Footer** - Brand info with logo, product/legal links, copyright

## Working with `.pen` Files

See [pen-guidelines.md](pen-guidelines.md) for detailed guidelines on editing `.pen` files with the Pencil MCP tools.
