#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function svg(title, body, attributes = 'fill="none" stroke="currentColor"') {
  return `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 64 64"
     role="img"
     aria-label="${title}"
     focusable="false"
     ${attributes}
     stroke-width="3"
     stroke-linecap="round"
     stroke-linejoin="round">
  <title>${title}</title>
${body}
</svg>
`;
}

const icons = {
  "icons/marking/statement-marking.svg": svg("STIX Statement Marking", `  <path d="M9 18h25l21 14-21 14H9z"/>
  <circle cx="19" cy="32" r="4"/>
  <path d="M29 27h13M29 33h10M29 39h6"/>`),

  "icons/badge/archive-ext.svg": svg("STIX Archive File Extension", `  <rect x="10" y="14" width="44" height="11" rx="3"/>
  <path d="M14 25v25h36V25M25 34h14M27 42h10"/>`),
  "icons/badge/ntfs-ext.svg": svg("STIX NTFS File Extension", `  <path d="M14 10h25l11 11v33H14zM39 10v12h11"/>
  <circle cx="25" cy="33" r="3"/><circle cx="39" cy="42" r="3"/>
  <path d="M28 33h5c3 0 6 3 6 6"/>`),
  "icons/badge/pdf-ext.svg": svg("STIX PDF File Extension", `  <path d="M15 9h23l11 11v35H15zM38 9v12h11"/>
  <path d="M22 42c8-3 14-9 17-17-2 10-1 17 5 22-8-6-15-7-22-5z"/>`),
  "icons/badge/raster-image-ext.svg": svg("STIX Raster Image File Extension", `  <rect x="9" y="13" width="46" height="38" rx="4"/>
  <circle cx="22" cy="25" r="4"/>
  <path d="m13 45 12-12 8 8 7-7 11 11"/>`),
  "icons/badge/windows-pebinary-ext.svg": svg("STIX Windows PE Binary File Extension", `  <path d="M10 11h20v20H10zM34 11h20v20H34zM10 35h20v18H10zM34 35h20v18H34z"/>
  <circle cx="20" cy="21" r="2" fill="currentColor" stroke="none"/>
  <circle cx="44" cy="21" r="2" fill="currentColor" stroke="none"/>
  <path d="M16 44h8M40 44h8"/>`),
  "icons/badge/http-request-ext.svg": svg("STIX HTTP Request Extension", `  <circle cx="30" cy="32" r="20"/>
  <path d="M10 32h40M30 12c7 7 9 31 0 40M30 12c-7 7-9 31 0 40"/>
  <path d="M42 20h12v12M54 20 41 33"/>`),
  "icons/badge/icmp-ext.svg": svg("STIX ICMP Extension", `  <path d="M7 33h10l5-12 8 24 7-17 5 5h15"/>
  <path d="M13 17a25 25 0 0 1 38 0M13 49a25 25 0 0 0 38 0"/>`),
  "icons/badge/socket-ext.svg": svg("STIX Socket Extension", `  <path d="M21 10v15M43 10v15M16 25h32v7a16 16 0 0 1-32 0zM32 48v7"/>
  <circle cx="26" cy="33" r="2" fill="currentColor" stroke="none"/>
  <circle cx="38" cy="33" r="2" fill="currentColor" stroke="none"/>`),
  "icons/badge/tcp-ext.svg": svg("STIX TCP Extension", `  <path d="M9 21h37M39 14l7 7-7 7M55 43H18M25 36l-7 7 7 7"/>
  <path d="M14 12v40M50 12v40"/>`),
  "icons/badge/windows-process-ext.svg": svg("STIX Windows Process Extension", `  <rect x="8" y="10" width="48" height="42" rx="3"/>
  <path d="M8 21h48M17 15h1M24 15h1"/>
  <circle cx="33" cy="36" r="8"/>
  <path d="M33 25v3M33 44v3M22 36h3M41 36h3M25 28l2 2M39 42l2 2M41 28l-2 2M27 42l-2 2"/>`),
  "icons/badge/windows-service-ext.svg": svg("STIX Windows Service Extension", `  <rect x="8" y="10" width="48" height="42" rx="3"/>
  <path d="M8 21h48M17 15h1M24 15h1"/>
  <path d="m24 43 15-15M22 30a8 8 0 0 0 10 10M42 41a8 8 0 0 0-10-10"/>
  <circle cx="23" cy="29" r="2"/><circle cx="41" cy="42" r="2"/>`),
  "icons/badge/unix-account-ext.svg": svg("STIX UNIX Account Extension", `  <rect x="8" y="11" width="48" height="42" rx="4"/>
  <path d="M8 21h48M16 30l7 6-7 6M29 43h12"/>
  <circle cx="16" cy="16" r="1" fill="currentColor" stroke="none"/>
  <circle cx="22" cy="16" r="1" fill="currentColor" stroke="none"/>`),

  "icons/extension/event.svg": svg("OASIS STIX Event Extension", `  <rect x="9" y="14" width="46" height="40" rx="4"/>
  <path d="M9 25h46M20 9v10M44 9v10"/>
  <path d="m32 31 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>`),
  "icons/extension/impact.svg": svg("OASIS STIX Impact Extension", `  <path d="m32 7 5 14 13-6-6 13 14 4-14 5 6 12-13-6-5 14-5-14-13 6 6-12-14-5 14-4-6-13 13 6z"/>
  <circle cx="32" cy="32" r="6"/>`),
  "icons/extension/task.svg": svg("OASIS STIX Task Extension", `  <rect x="10" y="9" width="44" height="46" rx="4"/>
  <path d="M19 21h4M31 21h15M19 32h4M31 32h15M19 43h4M31 43h15"/>
  <path d="m17 31 4 4 7-8"/>`),
  "icons/extension/observed-string.svg": svg("OASIS STIX Observed String Extension", `  <path d="M6 31s9-15 26-15 26 15 26 15-9 15-26 15S6 31 6 31z"/>
  <circle cx="32" cy="31" r="7"/>
  <path d="M18 52h28"/>`),

  "icons/marking/cui.svg": svg("STIX CUI Marking Extension", `  <path d="M14 29h36v26H14zM21 29v-8a11 11 0 0 1 22 0v8"/>
  <circle cx="32" cy="40" r="4"/><path d="M32 44v5"/>`),
  "icons/marking/pap.svg": svg("STIX PAP Marking Extension", `  <circle cx="32" cy="19" r="7"/><circle cx="16" cy="40" r="7"/><circle cx="48" cy="40" r="7"/>
  <path d="M26 23 21 34M38 23l5 11M23 40h18"/>
  <path d="M10 54c1-5 3-7 6-7s5 2 6 7M42 54c1-5 3-7 6-7s5 2 6 7"/>`),
  "icons/marking/iep.svg": svg("STIX IEP Marking Extension", `  <path d="M8 32h13l6-8 10 16 6-8h13"/>
  <path d="M13 20a22 22 0 0 1 38 0M13 44a22 22 0 0 0 38 0"/>
  <circle cx="8" cy="32" r="3"/><circle cx="56" cy="32" r="3"/>`),

  "icons/state/defanged.svg": svg("STIX Defanged State", `  <path d="M15 11h34v18c0 14-7 22-17 27-10-5-17-13-17-27z"/>
  <path d="m23 25 5 12 4-8 4 8 5-12M11 53 53 11"/>`),
  "icons/state/revoked.svg": svg("STIX Revoked State", `  <circle cx="32" cy="32" r="23"/><path d="m16 48 32-32"/>`),
  "icons/state/granular-marking.svg": svg("STIX Granular Marking", `  <path d="M9 9h46v46H9zM24 9v46M40 9v46M9 24h46M9 40h46"/>
  <circle cx="32" cy="32" r="7"/><circle cx="32" cy="32" r="2" fill="currentColor" stroke="none"/>`),
  "icons/state/language-marking.svg": svg("STIX Language Marking", `  <path d="M8 12h36v29H25L14 51V41H8z"/>
  <circle cx="26" cy="26" r="9"/>
  <path d="M17 26h18M26 17c3 3 4 15 0 18M26 17c-3 3-4 15 0 18M46 31h10v21H39v-6"/>`),

  "icons/fallback/custom-sdo.svg": svg("Custom STIX Domain Object", `  <circle cx="32" cy="32" r="23"/>
  <path d="M25 25a8 8 0 1 1 10 8c-3 1-3 3-3 5M32 46h.1"/>`),
  "icons/fallback/custom-sco.svg": svg("Custom STIX Cyber-observable Object", `  <rect x="9" y="9" width="46" height="46" rx="5"/>
  <path d="M25 25a8 8 0 1 1 10 8c-3 1-3 3-3 5M32 46h.1"/>`),
  "icons/fallback/custom-sro.svg": svg("Custom STIX Relationship Object", `  <path d="m32 6 26 26-26 26L6 32z"/>
  <path d="M18 32h28M39 25l7 7-7 7"/>`),
  "icons/fallback/custom-smo.svg": svg("Custom STIX Meta Object", `  <path d="M8 18h27l21 14-21 14H8z"/>
  <circle cx="19" cy="32" r="4"/>
  <path d="M31 27a6 6 0 1 1 5 9c-2 1-2 2-2 4M34 44h.1"/>`),
  "icons/fallback/custom-object.svg": svg("Custom STIX Object", `  <path d="M32 6 54 19v26L32 58 10 45V19z"/>
  <path d="M25 25a8 8 0 1 1 10 8c-3 1-3 3-3 5M32 46h.1"/>`),
  "icons/badge/custom-extension.svg": svg("Custom STIX Extension", `  <path d="M25 9h14v12a7 7 0 1 1 7 7h9v14H43a7 7 0 1 1-7 7v6H22V43a7 7 0 1 1-7-7H9V22h12a7 7 0 1 1 7-7V9z"/>`),

  "icons/legacy/source.svg": svg("Legacy STIX Source", `  <circle cx="20" cy="32" r="10"/>
  <path d="M30 32h26M47 23l9 9-9 9M20 22V10M14 15l6-6 6 6"/>`),
  "icons/legacy/victim.svg": svg("Legacy STIX Victim", `  <circle cx="32" cy="19" r="9"/>
  <path d="M16 54c1-14 6-22 16-22s15 8 16 22"/>
  <path d="M8 20h7M49 20h7M32 4v6"/>`),
  "icons/legacy/victim-target.svg": svg("Legacy STIX Victim Target", `  <circle cx="32" cy="32" r="25"/><circle cx="32" cy="32" r="16"/>
  <circle cx="32" cy="25" r="6"/>
  <path d="M22 43c1-7 4-11 10-11s9 4 10 11M32 4v7M32 53v7M4 32h7M53 32h7"/>`),
};

const tlp = {
  "icons/marking/tlp-white.svg": {
    title: "STIX TLP WHITE Marking",
    color: "#FFFFFF",
    cue: `<path d="M19 22 23 42 28 29 32 42 37 29 41 42 45 22"/>`,
  },
  "icons/marking/tlp-green.svg": {
    title: "STIX TLP GREEN Marking",
    color: "#33FF00",
    cue: `<path d="M43 25a13 13 0 1 0 0 14v-8H33"/>`,
  },
  "icons/marking/tlp-amber.svg": {
    title: "STIX TLP AMBER Marking",
    color: "#FFC000",
    cue: `<path d="m20 43 12-24 12 24M25 34h14"/>`,
  },
  "icons/marking/tlp-red.svg": {
    title: "STIX TLP RED Marking",
    color: "#FF2B2B",
    cue: `<path d="M22 44V20h10a8 8 0 0 1 0 16H22M34 36l9 8"/>`,
  },
  "icons/marking/tlp-clear.svg": {
    title: "TLP CLEAR Marking",
    color: "#FFFFFF",
    cue: `<path d="M43 25a13 13 0 1 0 0 14"/>`,
  },
  "icons/marking/tlp-amber-strict.svg": {
    title: "TLP AMBER STRICT Marking",
    color: "#FFC000",
    cue: `<path d="m14 43 10-22 10 22M18 35h12M50 25c-2-4-14-4-14 2 0 7 14 3 14 11 0 6-12 7-15 1"/>`,
  },
};

for (const [path, { title, color, cue }] of Object.entries(tlp)) {
  icons[path] = svg(
    title,
    `  <rect x="6" y="12" width="52" height="40" rx="6" fill="#000000" stroke="${color}"/>
  <g stroke="${color}">${cue}</g>`,
    'fill="none"',
  );
}

for (const [relativePath, contents] of Object.entries(icons)) {
  const path = resolve(root, relativePath);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, "utf8");
}

console.log(`Generated ${Object.keys(icons).length} support icons.`);
