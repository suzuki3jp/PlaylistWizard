# Design Token Extraction Notes

Phase 1 tokens are extracted from the current shadcn components and
`apps/www/src/app/global.css`. They are intentionally conservative: values are
only promoted when the existing UI already uses the concept.

## Initial Token Groups

- Color: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`,
  `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `sidebar`,
  `chart-*`.
- Typography: `font-sans`, `font-mono`.
- Radius: `radius-sm`, `radius-md`, `radius-lg`, `radius-xl`.
- State colors: hover, focus, invalid, destructive, checked, active states are
  currently expressed through semantic color tokens and opacity modifiers.

## Deferred Extraction

- Page-specific `gray-*`, `pink-*`, `blue-*`, `green-*`, and spacing classes are
  intentionally left for Phase 2 page migrations.
- Component sizing values such as `h-9`, `px-4`, `gap-2`, and `size-9` remain in
  component variants until repeated usage across pages justifies naming them.
