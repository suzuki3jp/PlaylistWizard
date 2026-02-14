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

The site header with logo, navigation links, and CTA button.

**Structure:**

```
Component/Header (frame, 1440x64, fill: #09090BCC, justify: space_between)
  ├── Logo Group (ref → Component/Logo)
  ├── Nav Links (frame, gap: 32)
  │   ├── navFeatures (text, "Features")
  │   ├── navFaq (text, "FAQ")
  │   └── navGithub (text, "GitHub")
  └── Get Started Button (frame, gradient fill, cornerRadius: 8)
      ├── ctaText (text, "Get Started")
      └── ctaIcon (icon_font, arrow-right)
```

**Overridable node IDs (for i18n):**

| Node ID | Name | EN default | JA override |
|---|---|---|---|
| `63aNU` | navFeatures | Features | 機能 |
| `YPkJU` | navFaq | FAQ | よくある質問 |
| `aqjh1` | ctaText | Get Started | はじめる |

## Page Sections

Each landing page contains the following sections (in order):

1. **Header** - ref instance of `Component/Header`
2. **Hero Section** - Badge, headline, subtitle, CTA buttons, screenshot placeholder
3. **Features Section** - 6 feature cards in 2 rows of 3
4. **FAQ Section** - 5 FAQ items (first one expanded)
5. **Final CTA Section** - Headline, subtitle, CTA button
6. **Footer** - Brand info with Logo instance, product/legal links, copyright

## Working with `.pen` Files

See [pen-guidelines.md](pen-guidelines.md) for detailed guidelines on editing `.pen` files with the Pencil MCP tools.
