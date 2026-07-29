# Pull request screenshots

These images are focused review evidence for the icon replacement pull
requests. Use the PNGs in pull request descriptions; the SVG sources are kept
where a deterministic, self-contained source is practical.

| Pull request | Screenshot | What it demonstrates |
| --- | --- | --- |
| Canonical repository / cross-project | `variant-decision.png` | Why standalone tiles include labels while interactive graphs and composed badges do not |
| Canonical repository / cross-project | `tlp-variants.png` | Complete visible coverage for WHITE, CLEAR, GREEN, AMBER, AMBER+STRICT, RED, and Statement markings |
| `oasis-open/cti-stix-visualization#68` | `visualizer-impact.png` | Actual application graph and legend with filled glyphs and native labels |
| `oasis-open/cti-documentation#140` | `docs-examples-impact.png` | Before/after examples-table treatment using real legacy and replacement assets |
| `oasis-open/cti-documentation#140` | `docs-relationships-impact.png` | Before/after relationship nodes at matched graph scale |
| `freetaxii/stix2-graphics#8` | `freetaxii-exports.png` | The nine labeled, presentation-ready 300-DPI exports |
| `freetaxii/freetaxii.github.io#2` | `freetaxii-gallery.png` | The labeled catalog in the rendered STIX 2.1 gallery |

`tlp-variants.svg` and `variant-decision.svg` are generated from their
`*.template.svg` files by:

```sh
node tools/embed-screenshot-svg-images.mjs
```

The generated SVGs embed the canonical icon geometry so GitHub and local
rasterizers do not need filesystem access to linked image assets.

Generate the FreeTAXII contact-sheet source from an upstream graphics checkout:

```sh
node tools/generate-freetaxii-contact-sheet.mjs /path/to/stix2-graphics
```

Rasterize the self-contained sources with librsvg:

```sh
rsvg-convert preview/pr-screenshots/tlp-variants.svg \
  -o preview/pr-screenshots/tlp-variants.png
rsvg-convert preview/pr-screenshots/variant-decision.svg \
  -o preview/pr-screenshots/variant-decision.png
rsvg-convert preview/pr-screenshots/freetaxii-exports.svg \
  -o preview/pr-screenshots/freetaxii-exports.png
```

The visualizer and gallery images are captures of the actual current pull
request branches served from a local HTTP server. The documentation composites
embed the real legacy and replacement assets at matched scale to keep the icon
impact legible at pull-request width.
