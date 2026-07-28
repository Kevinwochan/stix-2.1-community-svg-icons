# STIX Icon Color Profiles

The SVG artwork has no fixed palette. Every icon renders through
`currentColor`, so applications can choose monochrome or opt into a
compatibility theme.

## Monochrome default

Monochrome is the portable default:

| Theme | Foreground | Card |
| --- | --- | --- |
| Light | `#334155` | `#FFFFFF` |
| Dark | `#CBD5E1` | `#151E2E` |

## OASIS visualizer-compatible profile

The optional `oasis_visualizer_compatible` profile preserves familiar
type-level hue associations from the OASIS CTI STIX visualizer and the Bret
Jordan icon assets it uses. Examples include red Threat Actor and Malware,
orange Incident, green Course of Action and Relationship, purple Sighting and
Email, brown Bundle, blue network-address objects, and charcoal technical
payload/file objects.

This is a **non-normative compatibility theme**. STIX 2.1 does not standardize
object colors. The supplied values are flat accessible adaptations, not exact
copies of the source artwork's gradients or antialiasing colors.

Sources:

- [OASIS STIX visualizer repository](https://github.com/oasis-open/cti-stix-visualization)
- [OASIS STIX object introduction](https://oasis-open.github.io/cti-documentation/stix/intro.html)

The complete type-to-token map is in `color-scheme.json`; the ready-to-use CSS
selectors are in `color-scheme.css`. Every supplied foreground exceeds 4.5:1
contrast against its corresponding card background.

The generated `preview/color-scheme.svg` shows two UI treatments for every
type: an inverse icon on a compact colored background and the standalone
colored line icon. Backgrounds belong to the surrounding badge or node
component; they are never embedded in the canonical SVG files.

## Rules

1. Keep SVG files on `currentColor`; never bake palette values into geometry.
2. Use monochrome unless compatibility with the established visualizer cues is
   useful to the product.
3. Never use color as the only signal. Pair it with the icon and the serialized
   type or a readable label.
4. Treat warning, error, selected, muted, revoked, confidence, and TLP as
   separate semantic channels. Apply them to badges, outlines, or state
   indicators rather than replacing the object-type color.
5. Do not describe this profile as an official or normative OASIS/STIX palette.
6. When using a colored background, render the icon in the theme's contrasting
   card color and keep sufficient padding around the geometry.

## HTML examples

Monochrome is automatic:

```html
<span
  class="stix-icon stix-icon-mask"
  role="img"
  aria-label="Threat Actor"
  style="--stix-icon-url: url('../icons/sdo/threat-actor.svg')"></span>
```

Opt into compatibility colors on an ancestor and identify each type:

```html
<div data-stix-color-profile="oasis-compatible">
  <span
    class="stix-icon stix-icon-mask"
    data-stix-type="threat-actor"
    role="img"
    aria-label="Threat Actor"
    style="--stix-icon-url: url('../icons/sdo/threat-actor.svg')"></span>
</div>
```

For inherited `currentColor`, inline the SVG, use an SVG sprite, or use the
provided CSS-mask pattern. CSS cannot propagate `color` into a standalone SVG
loaded through a normal `<img>` element.
