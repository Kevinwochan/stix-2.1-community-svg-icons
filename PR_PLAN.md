# Upstream pull request plan

This document prepares the STIX 2.1 community SVG icon set for review without
assuming that every repository containing STIX code should receive an icon
change.

## Relevant repositories

Only four existing repositories have a direct graphics or documentation
surface for this work:

1. `oasis-open/cti-stix-visualization`
2. `oasis-open/cti-documentation`
3. `freetaxii/stix2-graphics`
4. `freetaxii/freetaxii.github.io`

Validators, schemas, language SDKs, object libraries, converters, and content
generators should not receive cosmetic icon pull requests.

## Coverage model and independent audit

The 43-object inventory is necessary but is not, by itself, a complete STIX UI
asset inventory. The original validator only compared `inventory.entities`
with the canonical icon directories. It did not validate fallbacks, markings,
extension-suite objects, or consuming-repository asset conventions. This
self-referential check is why TLP and the following gaps were not detected
earlier.

The release inventory must report these classes independently:

- 43 canonical top-level entities.
- Five normative STIX 2.1 marking presentations: Statement and
  `TLP:WHITE`, `TLP:GREEN`, `TLP:AMBER`, and `TLP:RED`.
- Two current TLP 2.0 compatibility additions: `TLP:CLEAR` and
  `TLP:AMBER+STRICT`.
- All 12 predefined object-extension badges plus `custom-extension`.
- Four supported OASIS candidate-extension objects: `event`, `impact`, `task`,
  and `observed-string`.
- Generic CUI, PAP, and IEP marking-extension badges.
- `defanged`, `revoked`, `granular-marking`, and `language-marking` state or
  property indicators.
- `custom-sdo`, `custom-sco`, `custom-sro`, and `custom-smo` fallbacks.
- Compatibility aliases for upstream filenames and historical concepts.

Blocking requirements before any PR is described as complete:

- Validate every inventory class independently; never use a 43-entity pass as
  evidence that the whole UI asset surface is complete.
- Resolve marking variants from canonical marking IDs, Extension Definition
  IDs, `definition_type`, and definition values rather than from the shared
  `marking-definition` object type alone.
- Record Incident accurately as 18 fully defined SDOs plus the STIX 2.1
  Incident stub, rather than describing all 19 as equivalent.
- Add an explicit upstream mapping manifest and tests. Filename coverage in
  this source repository does not prove that a consuming application resolves
  every serialized type.
- Audit every upstream asset outside the canonical set and give it an explicit
  `preserve`, `replace`, or `modernize` disposition.

Known upstream-only assets requiring that disposition include:

- OASIS visualizer: `custom-object`, `event`, `impact`, `task`, `http`, `tlp`,
  `source`, `victim`, and `victim-target`.
- OASIS documentation: `restricted-marking`, `tlp-white`, `tlp-green`,
  `tlp-amber`, and `tlp-red`.
- FreeTAXII graphics: the historical marking variants, including restricted
  and legacy WHITE artwork.

Canonical aliases are `coa` → `course-of-action`, `language` →
`language-content`, and `http` → `http-request-ext`. A generic `tlp` asset
resolves only when a more specific marking cannot be determined. `source`,
`victim`, and `victim-target` are preserved historical presentation concepts,
not STIX 2.1 object types.

The supported OASIS candidate-extension layer contains `event`, `impact`,
`task`, and `observed-string`. These objects must be labeled as extension-
defined and must not be added to the canonical STIX 2.1 count. Unknown
extension-defined SDOs resolve through `custom-sdo`; unknown extension
properties resolve through `custom-extension`.

The 12 predefined object extensions are compact badges on their parent object,
not standalone graph nodes. They are required for complete support:
`archive-ext`, `ntfs-ext`, `pdf-ext`, `raster-image-ext`,
`windows-pebinary-ext`, `http-request-ext`, `icmp-ext`, `socket-ext`,
`tcp-ext`, `windows-process-ext`, `windows-service-ext`, and
`unix-account-ext`.

Object properties and UI state are also a separate presentation layer.
`revoked` and `defanged` are node overlays; granular and language markings
belong at the affected field or property. Confidence, invalid or unresolved
references, selection, warning, and muted state may use application-owned
indicators, but must not recolor the type icon in a way that conflicts with a
marking. Application integration tests must verify the resulting composition.

## Resolver contract

Consumers must use the following deterministic precedence:

1. Canonical TLP marking-definition ID
2. Known marking Extension Definition ID
3. Marking `definition_type` and definition value
4. Exact object `type`
5. Attached predefined extension keys
6. Registered compatibility alias
7. Category-specific custom-object or custom-extension fallback

The resolver returns a base entity icon plus zero or more badges or state
overlays. It must not promote a predefined extension badge into an independent
graph node. Tests must cover canonical values, aliases, unknown custom values,
conflicting inputs, and the generic fallback path.

## TLP companion badges

Traffic Light Protocol markings are required companion UI assets, but they are
not additional STIX entity types and do not change the canonical count of 43.
They must be implemented as textual badges rather than color-only icons.

Support both of these layers explicitly:

- Current FIRST TLP 2.0 presentation: `TLP:RED`, `TLP:AMBER`,
  `TLP:AMBER+STRICT`, `TLP:GREEN`, and `TLP:CLEAR`.
- STIX 2.1 serialization compatibility: the standard marking-definition
  values and IDs for `white`, `green`, `amber`, and `red`.

Requirements:

- Preserve the serialized STIX value and marking-definition ID; never silently
  rewrite `white` to `clear` in exchanged STIX 2.1 data.
- Present `TLP:CLEAR` as the current human-facing TLP 2.0 label where the
  application offers a modern display alias for legacy `white`.
- Always render the complete uppercase label. Color must not be the only cue.
- Use the official FIRST TLP 2.0 display colors and contrast treatment rather
  than the entity compatibility palette.
- Keep TLP badges outside canonical SVG geometry and outside object-type color
  selectors.
- Document `TLP:WHITE` as a STIX 2.1 compatibility label, not a current FIRST
  TLP 2.0 label.
- Validate labels, keyboard-readable text, contrast, light/dark rendering, and
  print/grayscale output.

Primary references:

- <https://www.first.org/tlp/>
- <https://docs.oasis-open.org/cti/stix/v2.1/stix-v2.1.html>

## Prerequisites

- Publish this repository to a stable GitHub URL so upstream reviews can link
  to the complete source, validator, previews, and design rationale.
- Confirm the contributor name to use in copyright and provenance statements.
- Sign the OASIS Individual Contributor License Agreement before opening either
  OASIS pull request:
  <https://www.oasis-open.org/resources/open-repositories/cla/individual-cla>
- Keep the contribution under BSD-3-Clause for the OASIS repositories.
- Explicitly identify the licensing of files proposed to
  `freetaxii/stix2-graphics`, whose existing graphics are CC BY-SA 4.0.
- Update any repository-wide license statement that currently describes all
  graphics as CC BY-SA 4.0. A subdirectory README alone is not enough to make
  a mixed-license contribution unambiguous. Add per-directory license wording
  and SPDX identifiers to the new source files.
- Open or reference a tracking issue before submitting a large asset change.
- Satisfy the mandatory no-Copilot authorship gate below before any commit is
  pushed or any PR is opened.

## Mandatory no-Copilot authorship gate

- Do not use GitHub Copilot to draft commit messages, PR titles, PR
  descriptions, review replies, or release notes.
- Do not add Copilot co-author trailers, attribution lines, generated-by
  footers, badges, or links.
- Write each commit message from the actual staged diff.
- Write each PR description from the final commit range and verified test
  output; do not reuse generic generated summaries.
- Review the complete GitHub-rendered title and body before submission.
- Before pushing, scan the branch history and proposed PR text for
  `copilot`, `co-authored-by`, `generated by`, and `generated with`.

Every planned PR must record all of these checks as complete:

- [ ] Commit subjects and bodies were written without GitHub Copilot.
- [ ] PR title and description were written without GitHub Copilot.
- [ ] Review replies and release notes were written without GitHub Copilot.
- [ ] No Copilot attribution, trailer, footer, badge, or link is present.
- [ ] The final branch history passed the prohibited-marker scan.
- [ ] The final rendered PR title and body were manually reviewed.

Failure of any check blocks the push or PR submission.

## Submission sequence

1. Publish this source repository with the expanded inventory, generated
   previews, validator output, provenance, and explicit license.
2. Open the FreeTAXII graphics PR so downstream gallery links have an accepted
   asset location and the mixed-license treatment can be agreed.
3. Open the OASIS visualizer PR with the semantic resolver and application-
   level accessibility tests.
4. Open the OASIS documentation PR after the asset names and marking behavior
   are stable; it may proceed in parallel with the visualizer only when both
   PRs link to the same source revision and mapping manifest.
5. Open the FreeTAXII gallery PR only after the graphics paths are accepted.

## Target PR: OASIS STIX visualizer

Repository: <https://github.com/oasis-open/cti-stix-visualization>

Base branch: `master`

Proposed branch: `codex/stix-2.1-svg-icons`

Proposed title:

> Add accessible STIX 2.1 SVG icon set

Scope:

- Add the 43 dependency-free SVGs without deleting legacy non-canonical icons.
- Add the marking, extension, extension-object, state, alias, and fallback
  assets that the visualizer actually exposes; report each group separately.
- Preserve the existing visualizer-specific types that are outside the
  canonical STIX 2.1 inventory.
- Add the semantic resolver described above rather than relying on filename
  guessing or the serialized `type` alone.
- Keep custom icon configuration and legacy PNG fallback behavior working.
- Use the documented OASIS-compatible type colors as an optional presentation
  profile; retain a monochrome path. Because vis-network loads
  `circularImage` URLs, generate a colored resource or use another supported
  rendering mechanism instead of expecting an external SVG to inherit the
  page's `currentColor`.
- Add TLP markings as a separate text-badge layer, including legacy STIX 2.1
  `TLP:WHITE` compatibility and current FIRST `TLP:CLEAR` presentation.
- Add extension badges to their parent nodes, state overlays to applicable
  nodes, and property-level treatment for granular and language markings.
- Add an executable test harness and CI job covering the 43 canonical types,
  every supported variant and alias, and all fallback paths.
- Give every rendered node, legend item, and marking badge an application-
  level accessible name. Metadata inside a canvas-loaded SVG is not exposed
  to assistive technology.
- Include small-size and light/dark preview evidence in the PR description.

Related issue:

- <https://github.com/oasis-open/cti-stix-visualization/issues/61>

Acceptance checks:

- Every canonical STIX 2.1 type resolves to an SVG.
- Statement, all four STIX 2.1 TLP variants, and both additional TLP 2.0
  presentations resolve from semantic marking data.
- All 12 predefined extension badges stay attached to their parent entities;
  `event`, `impact`, `task`, and `observed-string` resolve as explicitly
  labeled candidate-extension objects.
- State indicators, compatibility aliases, and custom fallbacks resolve
  without suppressing the base object icon.
- Existing custom-icon URLs still work.
- Existing legacy-only icons still render.
- Keyboard and screen-reader testing exposes meaningful node, legend, and
  badge names independently of SVG-internal `<title>` content.
- TLP labels remain understandable without color and pass contrast,
  light/dark, grayscale, and print checks.
- No scripts, external references, embedded fonts, or raster content exist in
  the contributed SVGs.
- The documented test command runs in CI and fails for a missing asset or
  resolver mapping.
- The upstream CodeQL workflow remains green.

## Target PR: OASIS CTI documentation

Repository: <https://github.com/oasis-open/cti-documentation>

Base branch: `main`

Proposed branch: `codex/stix-2.1-svg-doc-icons`

Proposed title:

> Use accessible SVGs for STIX 2.1 object documentation

Scope:

- Add SVG equivalents for the STIX objects displayed in `img/icons/`.
- Inventory and update all icon references, including Markdown, HTML, and
  nested `xlink:href` or `href` references in relationship SVGs; do not assume
  that replacing Markdown image links completes the migration.
- Update documentation image references from legacy PNGs to SVGs while
  preserving intentional historical screenshots.
- Keep TLP and Statement/restricted-marking work in a distinct commit so
  reviewers can evaluate marking semantics separately without leaving the
  final PR incomplete.
- Add a documented TLP 2.0 badge example while preserving the STIX 2.1
  `TLP:WHITE` serialization example.
- Document the difference between canonical entities, extension-defined
  objects, predefined extension badges, and UI state overlays.
- Add a short attribution and non-normative color note.
- Preserve image dimensions and alt text to avoid page-layout regressions.

Sequence:

- Open after the visualizer PR establishes the canonical asset source, or link
  both PRs explicitly if they are reviewed in parallel.

Acceptance checks:

- The Jekyll site builds without broken image references.
- A repository-wide reference audit finds no unintended legacy icon path,
  including references embedded inside relationship SVGs.
- All current STIX object rows retain meaningful alt text.
- TLP and Statement examples include visible text and remain meaningful in
  grayscale.
- The documentation validator workflow remains green.
- Page screenshots show no clipping at the existing icon dimensions.

## Target PR: FreeTAXII STIX graphics

Repository: <https://github.com/freetaxii/stix2-graphics>

Base branch: `master`

Proposed branch: `codex/add-stix-2.1-svg-set`

Proposed title:

> Add complete vector-native STIX 2.1 SVG set

Scope:

- Add the complete, taxonomy-separated SVG set in a new, clearly named
  directory.
- Do not overwrite the historical EPS and PNG artwork.
- Add a README section explaining the 64 × 64 `currentColor` contract,
  taxonomy, resolver behavior, previews, source repository, and license.
- Export deterministic 300-dpi PNG versions for the nine Cyber-observable
  types requested by issue #4. A vector-only contribution does not satisfy
  that request.
- Add current TLP 2.0 badge assets alongside, rather than over, the historical
  TLP artwork; retain an explicitly labeled legacy `TLP:WHITE` compatibility
  asset.
- Preserve the distinction between the historical CC BY-SA assets and the new
  BSD-3-Clause files in the root repository license wording, new-directory
  README, and SPDX identifiers unless the maintainer requests a different
  contribution license.

Related issue:

- <https://github.com/freetaxii/stix2-graphics/issues/4>

Acceptance checks:

- All inventory classes pass this repository's validator before copying; the
  result reports the 43 canonical entities independently.
- The nine issue-requested PNGs have reproducible source SVGs, intended
  dimensions, and 300-dpi metadata.
- The added directory contains no generated dependency or external asset.
- README links and preview images render on GitHub.
- The root license statement and per-directory metadata unambiguously describe
  the mixed CC BY-SA/BSD-3-Clause repository.
- The maintainer confirms the desired license treatment before merge.

## Target PR: FreeTAXII icon gallery

Repository: <https://github.com/freetaxii/freetaxii.github.io>

Base branch: `master`

Proposed branch: `codex/publish-stix-2.1-svg-gallery`

Proposed title:

> Add STIX 2.1 SVG icon gallery

Scope:

- Update `stix2-icons.html` with a clearly labeled STIX 2.1 SVG section.
- Add the full and small-size preview images used by the gallery.
- Link SVG downloads to the accepted directory in `stix2-graphics`.
- Retain the historical STIX 2.0 PNG and EPS sections.
- Add a distinct TLP 2.0 badge section with CLEAR, GREEN, AMBER,
  AMBER+STRICT, and RED, plus a legacy STIX 2.1 WHITE compatibility note.
- Present canonical entities separately from extension badges,
  candidate-extension objects, state indicators, and compatibility assets.
- State the SVG set's license and non-normative color status.
- Use meaningful image alt text and avoid duplicating all 43 source SVGs in
  the website repository unless requested by its maintainer.

Sequence:

- Open only after, or together with an explicit dependency on, the
  `stix2-graphics` asset PR.

Acceptance checks:

- `stix2-icons.html` renders locally without broken links.
- Preview images are readable on narrow and desktop layouts.
- Existing STIX 2.0 gallery links remain intact.
- The new download links resolve to the proposed SVG asset directory.
- Every displayed asset has visible descriptive text and meaningful alt text;
  TLP remains understandable without color.

## Suggested PR description structure

Each PR should include:

1. The recognition and accessibility problem being addressed.
2. The exact asset taxonomy, semantic mappings, and files changed.
3. Before/after preview images at 24 and 32 CSS pixels.
4. The non-normative status of the compatibility colors.
5. Application-level accessibility evidence, not only SVG metadata.
6. Validation commands and results, including resolver and alias coverage.
7. Licensing, authorship, and CLA statements.
8. Links to the canonical source repository and related upstream issue.

## Baseline readiness and release gate

This snapshot records the verified implementation and publication state.
OASIS submission remains gated separately by its Individual CLA:

- Canonical coverage: 43 of 43 top-level STIX 2.1 entity types.
- Semantic support coverage: 39 of 39 inventoried assets, for 82 unique SVGs.
- SVG XML, dependency, security, geometry, and inventory validation: passing.
- Light/dark type-color contrast: passing at 4.5:1 or higher.
- All 82 SVGs render non-empty at 24 CSS pixels.
- Entity small-size previews: generated at 24 and 32 CSS pixels.
- Support and resolver-composition previews: generated and visually reviewed.
- Background and no-background color variants: generated in the demo image.
- Required custom-type fallback SVGs: implemented and resolver-tested.
- TLP and Statement marking badge assets: implemented and resolver-tested.
- Candidate-extension icons (`event`, `impact`, `task`, and
  `observed-string`): implemented.
- Generic CUI, PAP, and IEP marking-extension badges: implemented.
- All 12 predefined object-extension badges: implemented.
- Reusable `defanged`, `revoked`, granular-marking, and language-marking
  indicators: implemented.
- Alias manifest and semantic resolver: implemented; 11 local tests passing.
- Visualizer integration: implemented and pushed to
  `Kevinwochan/cti-stix-visualization` on
  `codex/stix-2.1-svg-icons`; resolver, mocked vis-network integration,
  JavaScript syntax, package contents, XML, and accessibility surfaces pass
  locally.
- Documentation integration: implemented and pushed to
  `Kevinwochan/cti-documentation` on
  `codex/stix-2.1-svg-doc-icons`; 223 references across 23 files are migrated,
  including 148 nested relationship-diagram references. The dependency-free
  reference audit and strict XML checks pass locally.
- Nine deterministic PNG exports requested by FreeTAXII issue #4: generated at
  1200 × 1200 with verified 300-dpi metadata and reproducibility.
- Support-asset generation and PNG export generation: byte-for-byte
  reproducible locally.
- Canonical repository: published at
  <https://github.com/Kevinwochan/stix-2.1-community-svg-icons>; validation CI
  is green for source commit `58aad32`.
- Required forks: created for all four target repositories and each reviewed
  branch is pushed.
- FreeTAXII graphics PR: draft
  <https://github.com/freetaxii/stix2-graphics/pull/8>; GitHub reports it
  mergeable with a clean merge state.
- FreeTAXII gallery PR: draft
  <https://github.com/freetaxii/freetaxii.github.io/pull/2>; GitHub reports it
  mergeable with a clean merge state.
- OASIS visualizer PR: draft
  <https://github.com/oasis-open/cti-stix-visualization/pull/68>.
- OASIS documentation PR: draft
  <https://github.com/oasis-open/cti-documentation/pull/140>.
- The OASIS Individual CLA has been signed, but CLA Assistant still reports
  both repository checks as pending after an explicit recheck. Upstream CI and
  the CLA status remain the final external gates.
- Documentation Jekyll build: not completed locally because the repository's
  unconstrained dependency resolution requires a newer Ruby than the host.
  The icon/reference audit is wired into the existing GitHub Actions workflow,
  which will run with the repository's normal validator when the PR is opened.
