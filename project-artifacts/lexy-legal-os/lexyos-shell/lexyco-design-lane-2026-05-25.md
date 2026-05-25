# LexyCO Design Lane — 2026-05-25

**Seven / LexyOS visual design direction**
**Status:** Production-ready, frozen for Rog implementation.
**Drive:** https://drive.google.com/drive/folders/10opD8aP9KQpQgAElK_WqU0aTGx6hrO-s

## Executive summary

LexyOS cockpit takes Mike's workspace layout model (left nav / primary workspace / right rail) and translates it into Lexy's own visual language. The operating principle is: **warm, vibrant, distinct from Mike's cool azure monoculture, readable in a legal OS, and consistent across all PRD domains.**

This document is the build contract for Rog. Every token, selector, and breakpoint below is already mapped to the existing `public/styles.css` and `public/index.html`.

## 1. Skittles color system

Five core Skittles plus amber are the full Lexy emotional vocabulary. They are already wired as `var(--skittle-*)` in production CSS.

| Token | Hex | Semantic role | Example use |
|---|---|---|---|
| `--skittle-red` | `#ff4d6d` | Danger / reject | Reject gate, error panel, urgent alerts |
| `--skittle-yellow` | `#ffe66d` | Warning / attention | Pending badges, review-needed highlights |
| `--skittle-green` | `#2dd4bf` | Success / approve | Approve gate, healthy metrics, passing |
| `--skittle-blue` | `#60a5fa` | Primary / info | Selected ring, focus outline, live endpoints |
| `--skittle-purple` | `#c084fc` | Accent / brand | Orb glow, filing/service packets, brand moments |
| `--skittle-amber` | `#fbbf24` | Secondary warning | Stale/overdue (warm contrast against yellow) |

### Contrast rules
- Purple on `#070910`: ~5.8:1, WCAG AA.
- Green on dark: ~6.2:1.
- Yellow is **never dark text** — it is a background tint (`rgba(251,191,36,.12)` with `#fef3c7` foreground).
- Red surface text on `rgba(255,77,109,.12)` is `#fecdd3`.
- Document workspace alone flips to light (`#fffdf7` → `#eef4ff`) for readability; the shell stays dark.

### Surface vocabulary
| Token | Value |
|---|---|
| `--bg` | `#070910` |
| `--bg-radial` | Radial gradient with cyan/purple glow corners + deep navy sweep |
| `--panel` | `rgba(15,22,34,.78)` |
| `--panel-2` | `rgba(23,32,48,.84)` |
| `--surface-raised` | `rgba(255,255,255,.06)` |
| `--line` | `rgba(165,196,255,.16)` |
| `--line-strong` | `rgba(165,196,255,.28)` |

## 2. Layout architecture — Mike form, Lexy tone

### Desktop grid (the four-column cockpit)

```
280px  330px  1fr          360px
 NAV    FILES  WORKSPACE    AGENT RAIL
```

This is the direct translation: Mike's sidebar → matter nav + files. Mike's central chat/workspace → document cockpit. Mike's assistant/status rail → agent rail + gates + Eva. The difference is that the **nav is matter-centric**, not chat-centric, and the workspace prefers document action controls over a chat input.

### Responsive breakpoints

| Width | Behavior |
|---|---|
| > 1390px | Full four-column desktop |
| <= 1390px | Right rail drops to bottom row |
| <= 1024px | Left nav + files compress; workspace spans |
| <= 640px | Single column stack |

Fixed via `grid-template-columns` media queries, not JS.

### Hierarchical nesting
- Brand orb sits at the top of column 1 — instant identity.
- Search is immediately below (proximity = wayfinding).
- Matter list is the scrollable body.
- Baseline data + status timeline sit in column 2 below files.
- Document workspace's inner flex model: header → metrics strip → cockpit controls → document frame (flex:1 to fill).
- Agent rail is the eastern command surface (Scandinavian / LangChain cockpit pattern).

## 3. Typography

| Context | Stack |
|---|---|
| UI / data | Inter, ui-sans-serif, system-ui |
| Legal documents | EB Garamond, Georgia, serif |
| Mono / API / audit | JetBrains Mono, SF Mono, monospace |

| Role | Size | Weight | Letter-spacing | Color |
|---|---|---|---|---|
| Document title (H1) | `clamp(32px,4vw,54px)` | 900 | `-0.055em` | `#f5f8ff` |
| Panel kicker (H2/H3) | 11px | 500 | `0.14em` uppercase | `--muted` |
| Brand title | 25px | 900 | `-0.05em` | `#f5f8ff` |
| Matter card title | 14px | 700 | normal | `#f5f8ff` |
| Matter card meta | 12px | 400 | normal | `--muted` |
| Baseline label | 11px | 400 | `0.08em` uppercase | `--muted` |
| Baseline value | 14px | 700 | normal | `#f5f8ff` |
| Metric value | 22px | 700 | normal | `#f5f8ff` |
| Document body | 18px | 400 | normal | `#101827` (light frame) |

## 4. Component library (already in styles.css)

### Buttons
Five gradient-backed variants:

1. **Default / primary** — blue-to-teal gradient, black text.
2. **Success / approve** — green-to-yellow gradient, black text.
3. **Danger / reject** — red-to-mauve gradient, `#fecdd3` text.
4. **Accent / filing** — purple-to-blue gradient, `#f8fbff` text.
5. **Muted** — near-transparent, `--muted` text.

Shared: `border-radius: 16px`, `padding: 12px`, `font-weight: 850`, hover `translateY(-1px)`.

### Form elements
- Inputs: `rgba(7,11,19,.76)` background, `var(--line-strong)` border, `border-radius: 16px`.
- Focus: border shifts to `--skittle-blue` with `box-shadow: 0 0 0 3px rgba(96,165,250,.16)`.
- Textarea: `min-height: 118px`, `resize: vertical`.

### Panel chrome (`.shell-card`)
- `border: 1px solid var(--line)`
- `border-radius: 28px`
- `backdrop-filter: blur(22px) saturate(140%)`
- Backgrounds vary per column for depth.

### Status badges (`.badge`)
| Status | Border | Background | Foreground |
|---|---|---|---|
| pending | `rgba(251,191,36,.35)` | `rgba(251,191,36,.12)` | `#fef3c7` |
| approved | `rgba(45,212,191,.35)` | `rgba(45,212,191,.12)` | `#d1fae5` |
| rejected | `rgba(255,77,109,.35)` | `rgba(255,77,109,.12)` | `#fecdd3` |

`border-radius: 999px`, `padding: 5px 10px`, `font-weight: 700`.

### Gate/approval chips (`.gate-chip`)
- Full-width row, `flex` with label+meta left, badge right.
- Subtle gradient background `rgba(96,165,250,.10) → rgba(192,132,252,.10)`.
- Selected state uses same blue ring as `.matter-card.selected`.

### Status timeline
- 10px dot circles with color-separated glow shadows.
- `done` = green, `active` = blue, `future` = dimmed.
- 12px row gap, vertical stack.

## 5. App-level layout (Rog build contract)

Every selector below is already named in the production HTML/CSS and is the target for Rog's build pass:

```
LexyOS Shell
├── aside.lexy-nav.shell-card
│   ├── brand-stack (orb + LexyOS label)
│   ├── matter-search input
│   ├── matter-list .matter-card
│   └── nav-audit .audit-trail
├── aside.files-panel.shell-card
│   ├── panel-kicker "Matter baseline"
│   ├── file-list .file-card
│   ├── baseline-panel .baseline-row
│   └── status-timeline .status-step
├── section.document-workspace
│   ├── workspace-header
│   │   ├── panel-kicker + h1
│   │   └── .pill (context labels)
│   ├── metric-strip .metric-card
│   ├── cockpit-controls (buttons per action)
│   └── document-frame .doc-preview
└── aside.agent-rail.shell-card
    ├── session / API pre
    ├── active-endpoints .api-receipt
    ├── gate-list .gate-chip
    ├── tasks .artifact-card
    └── Eva textarea + btn
```

## 6. Dark mode

LexyOS is **dark-first.** Only `document-frame` flips to light (`#fffdf7` → `#eef4ff`) because legal documents need warm off-white. If a light mode toggle is ever added, only `--bg`, `--panel`, and `--text` flip. The Skittles palette stays absolute.

### Light mode token preview (not active — documented for future toggle)
```css
@media (prefers-color-scheme: light) {
  :root { --bg: #f8fafc; --panel: rgba(241,245,249,.92); --text: #0f172a; }
  .document-frame { /* stays warm off-white */ }
}
```

## 7. Accessibility

- Every `aside`/`section` has `aria-label`.
- All interactives are `<button>`, no clickable `<div>` without role.
- Focus ring is visible on all inputs.
- Color is **not** the only status indicator — badges use border + background + bold text; timeline uses dots + text.
- Minimum touch target 44px on mobile.

## 8. Decisions frozen for this sprint

| # | Decision |
|---|---|
| 1 | Do not add a sixth Skittle. Five is the max for human scan. |
| 2 | Do not change the border radius ladder. `14px / 18px / 28px` is canonical. |
| 3 | Do not add shadows to text. Only glows on the brand orb and metric cards. |
| 4 | Do not introduce a separate dark/light button palette. Gradients self-contrast. |
| 5 | Document frame stays warm off-white; everything else stays dark. |

## 9. PRD alignment note

The existing `index.html` + `styles.css` + `app.mjs` already render the full PRD layout. The PRD docs reference three key visual requirements that are now satisfied:

- **PRD F3 (Agent Cockpit):** Four-column grid with matter health metrics, gate list, and task cards — yes.
- **PRD F4 (Document workspace):** Light frame for readability, controlled generation/approval/filing/service buttons — yes.
- **PRD F6 (Admin/Cost/Status):** Live API receipts and status panels in agent rail — yes.

The remaining gap is the **Stage Timeline** in the files panel (`status-timeline`), which the design preview renders but the live app has not yet wired to real data. Rog should map baseline stage strings to the timeline component.

## 10. Artifacts delivered

| File | Location | Purpose |
|---|---|---|
| Design memo | `design-lane/LEXYOS-DESIGN-SYSTEM-MEMO.md` | Token library, layout rules, typography scale |
| HTML preview | `design-lane/lexyos-design-preview.html` | Interactive static proof for Rog and browser QA |
| Delivery doc | `lexyco-design-lane-2026-05-25.md` (this file) | Signed-off handoff with Drive link |

## 11. Next implementation lane

1. Rog resolves the Stage Timeline data wiring.
2. Rog implements gate-chip CSS selector for the live gate list.
3. Otto reviews PR for compliance with this memo before merge.
4. Alfred dispatches testing and blocker fixes if needed.

---

**Seven, visual creative / design systems lead**
Lexy Legal OS — Peacock Law Firm
2026-05-25
