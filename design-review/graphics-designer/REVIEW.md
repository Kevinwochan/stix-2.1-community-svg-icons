# Graphics Designer Review

## Direction

This pass deliberately avoids novelty. Each icon should use the first
recognizable industry or platform convention that survives at 24 px. A STIX
type icon identifies an object, not an action, so add, warning, send, and other
explanatory badges are excluded unless they are intrinsic to the concept.

The family keeps its 64-unit canvas, three-unit rounded stroke, and
`currentColor` contract.

## Approved conventions preserved

- Email Address: standalone `@`
- Email Message: plain envelope
- Sighting: plain eye
- Bundle: four tiles
- Observed Data: database cylinder

These are already canonical and remain unchanged.

## Restrained redraws

Eight icons were simplified:

| Type | Change | Conventional cue |
| --- | --- | --- |
| Attack Pattern | Removed route nodes and tiny arrow | Target |
| Campaign | Removed timeline and event dots | Flag |
| Incident | Replaced alarm assembly and rays | Warning triangle |
| Opinion | Removed plus/circle construction | Comment bubble |
| Threat Actor | Removed warning badge | Hooded actor silhouette |
| Artifact | Removed hash-like package detail | Package/cube |
| User Account | Removed add badge | Person/account |
| Marking Definition | Removed tiny internal text lines | Tag |

The other canonical icons were deliberately retained. They already use
recognizable conventions, need their compound form to distinguish a specialized
type, or would become ambiguous if simplified further. In particular:

- Course of Action and Vulnerability keep the familiar shield/check and
  shield/fracture pair.
- Malware Analysis keeps magnifier plus bug because the compound is the
  established distinction from Malware.
- Identity keeps an ID card; X.509 Certificate keeps document plus seal;
  Language Content keeps speech bubble plus globe.
- Network Traffic keeps opposing arrows; autonomous-system and address objects
  keep their established networking constructions.

## Color decision

The former family-only palette has been replaced. It hid familiar type cues,
including red Threat Actor. Monochrome is now the default, while an optional
`oasis_visualizer_compatible` profile preserves the type-level hue associations
used by the OASIS visualizer/Bret Jordan assets.

The compatibility values are adapted to exceed 4.5:1 contrast on supplied light
and dark cards. They are not normative STIX colors and are not embedded in any
SVG. State and marking colors remain separate badge/outline channels.

## Validation

The canonical set is checked for:

- all 43 inventory paths;
- unique geometry;
- 64 × 64 viewBox and three-unit rounded stroke contract;
- accessible title and ARIA label;
- no scripts, text, raster content, transforms, or external references;
- complete type-color mapping and minimum 4.5:1 contrast;
- 24 and 32 px preview rendering.

Review `preview/catalog-small.svg` for geometry and
`preview/color-scheme.svg` for the light/dark compatibility colors.
