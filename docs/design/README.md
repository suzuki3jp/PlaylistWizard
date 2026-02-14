# Design System (`app/design.pen`)

This document describes the design file structure, reusable components, and working guidelines for the PlaylistWizard `.pen` design file.

## Overview

The design file `app/design.pen` contains landing page designs for PlaylistWizard in two locales:

| Frame | ID | Description |
|---|---|---|
| PlaylistWizard Home | `w046m` | English landing page |
| PlaylistWizard Home (JA) | `5UNCZ` | Japanese landing page |

Both pages share the same reusable components, with locale-specific text applied via instance overrides.

## Reusable Components

Components are placed at the document root level (outside page frames) and named with the `Component/` prefix.

### Component/Logo (`HsAwh`)

The app logo used in headers and footers.

**Structure:**

```
Component/Logo (frame, gap: 10, alignItems: center)
  ├── logoIcon (frame, 24x24, image fill: ./src/images/icon.png)
  └── logoText (text, "PlaylistWizard", #FFFFFF, Geist 18 bold)
```

**Usage in instances:**

| Location | Override |
|---|---|
| Header | Default (24x24 icon, 18px text) |
| Footer | `logoIcon`: 20x20, `logoText`: fontSize 16, fill #FAFAFA |

### Component/Header (`Pf830`)

The site header with logo and hamburger menu icon. Navigation links and CTA have been moved to `Component/SideMenu`.

**Structure:**

```
Component/Header (frame, 1440x64, fill: #09090BCC, justify: space_between)
  ├── Left Group (frame, gap: 16, alignItems: center)
  │   ├── menuIcon (icon_font, lucide "menu", 24x24, #FAFAFA)
  │   └── Logo Group (ref → Component/Logo)
  └── ctaLink (text, "Get Started", Geist 14 semibold, #FAFAFA)
```

### Component/SideMenu (`mo4Ir`)

A side menu that slides in from the left, containing navigation links and CTA button. Width 300px, full page height.

**Structure:**

```
Component/SideMenu (frame, 300x900, fill: #09090B, border-right: #27272A, vertical, gap: 32)
  ├── Menu Header (frame, space_between)
  │   ├── Logo (ref → Component/Logo)
  │   └── closeIcon (icon_font, lucide "x", 24x24, #A1A1AA)
  ├── Nav Links (frame, vertical, gap: 8)
  │   ├── navFeatures (text, "Features", 16px, #A1A1AA)
  │   ├── navFaq (text, "FAQ", 16px, #A1A1AA)
  │   └── navGithub (text, "GitHub", 16px, #A1A1AA)
  └── CTA Button (frame, gradient fill, cornerRadius: 8, full-width)
      ├── ctaText (text, "Get Started", 16px, #FFFFFF)
      └── ctaIcon (icon_font, lucide "arrow-right", 16x16, #FFFFFF)
```

**Overridable node IDs (for i18n):**

| Node ID | Name | EN default | JA override |
|---|---|---|---|
| `Es8gr` | navFeatures | Features | 機能 |
| `lrQGV` | navFaq | FAQ | FAQ |
| `Z8ZCY` | navGithub | GitHub | GitHub |
| `Nk5Yh` | ctaText | Get Started | はじめる |

## Page Structure

Each landing page uses a free-positioning layout (`layout: none`) with two direct children: a **Content** frame for page sections and a **SideMenu** overlay.

```
PlaylistWizard Home (frame, layout: none, 1440px)
  ├── Content (frame, layout: vertical, 1440px, x: 0, y: 0)
  │   ├── Header (ref → Component/Header)
  │   ├── Hero Section
  │   ├── Features Section
  │   ├── FAQ Section
  │   ├── Final CTA Section
  │   └── Footer
  └── SideMenu (ref → Component/SideMenu, x: 0, y: 0, overlaps Content)
```

| Page | Content ID | SideMenu ID |
|---|---|---|
| EN (`w046m`) | `tENYy` | `KToMW` |
| JA (`5UNCZ`) | `ewWz0` | `LJX7Q` |

### Content Sections

1. **Header** - ref instance of `Component/Header` (hamburger + logo on left, "Get Started" on right)
2. **Hero Section** - Badge, headline, subtitle, CTA buttons, screenshot placeholder
3. **Features Section** - 6 feature cards in 2 rows of 3
4. **FAQ Section** - 5 FAQ items (first one expanded)
5. **Final CTA Section** - Headline, subtitle, CTA button
6. **Footer** - Brand info with Logo instance, product/legal links, copyright

## Working with `.pen` Files

See [pen-guidelines.md](pen-guidelines.md) for detailed guidelines on editing `.pen` files with the Pencil MCP tools.
