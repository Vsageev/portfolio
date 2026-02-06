# Design Guidelines

Exact rules and code references for replicating the //TODO_RENAME blog design system.

---

## 0. Branding

The site name is **//TODO_RENAME blog**. This is the canonical branding — always written exactly as `//TODO_RENAME` (two forward slashes, uppercase, with underscore). It appears in:

- **Page title** (metadata): `//TODO_RENAME blog`
- **Nav wordmark**: `//TODO_RENAME` (next to the profile image, in the breadcrumb)
- **Nav breadcrumb pattern**: `[portrait] //TODO_RENAME / {section}`

The wordmark uses `var(--font-sans)`, weight 600, 14px, `var(--text-primary)`. It is always accompanied by the circular profile image (28x28, `border-radius: 50%`, `border: 1px solid var(--border)`).

---

## 1. Fonts

Two fonts. No exceptions.

| Role | Family | Weights | Usage |
|------|--------|---------|-------|
| Sans | Be Vietnam Pro | 400, 500, 600, 700 | All UI text, headings, buttons, body copy |
| Mono | JetBrains Mono | 400, 500 | Labels, badges, code, metadata, timestamps |

```html
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

```css
--font-sans: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Menlo, monospace;
```

**Rule:** Monospace is used for _system-like_ content — section labels, tags, timestamps, status badges, form hints. Sans is everything else.

---

## 2. Color Tokens

The system uses CSS custom properties on `[data-theme]` selectors. Every color has a dark and light variant.

### Surfaces

```css
/* Dark */
--bg:             #000000;
--bg-elevated:    #0a0a0a;
--bg-card:        #050505;
--bg-hover:       #111111;

/* Light */
--bg:             #fafafa;
--bg-elevated:    #ffffff;
--bg-card:        #ffffff;
--bg-hover:       #f4f4f5;
```

**Rule:** Pure black `#000` background in dark mode. Off-white `#fafafa` in light. Elevated surfaces are _barely_ lighter/darker — the difference is subtle and intentional.

### Text Hierarchy

```css
/* Dark */
--text-primary:   #ededed;
--text-secondary: #b0b0b0;
--text-tertiary:  #888888;
--text-muted:     #555555;

/* Light */
--text-primary:   #0a0a0a;
--text-secondary: #525252;
--text-tertiary:  #8b8b8b;
--text-muted:     #c4c4c4;
```

**Rule:** Four levels. Primary for headings and important content. Secondary for body text (this is the default `body` color). Tertiary for descriptions and less important text. Muted for labels, separators, disabled states.

### Borders

```css
/* Dark */
--border:         rgba(255,255,255,0.08);
--border-hover:   rgba(255,255,255,0.16);

/* Light */
--border:         rgba(0,0,0,0.06);
--border-hover:   rgba(0,0,0,0.12);
```

**Rule:** Borders are always semi-transparent. Never solid hex colors. Hover state doubles the opacity.

### Accent & Semantic

```css
--accent:         #0070f3;      /* Vercel blue */
--accent-hover:   #1a8aff;      /* dark mode hover — lighter */
--accent-hover:   #005cc5;      /* light mode hover — darker */

--success:        #00c853;      /* dark */  /  #00a86b  /* light */
--error:          #e5484d;      /* same both themes */
--warning:        #f5a623;      /* dark */  /  #d97706  /* light */
```

### Prismatic Gradient (light mode only)

Five-color gradient used for the top line and text shimmer in light mode:

```css
--prism-1: #e84393;  /* pink */
--prism-2: #6c5ce7;  /* purple */
--prism-3: #0984e3;  /* blue */
--prism-4: #00b894;  /* green */
--prism-5: #fdcb6e;  /* gold */

--prism-gradient: linear-gradient(135deg, #e84393, #6c5ce7, #0984e3, #00b894, #fdcb6e);
```

**Rule:** Prismatic gradient is hidden in dark mode.

---

## 3. Spacing System

```css
--space-section:  100px;    /* between major sections */
--space-lg:       48px;     /* large gaps, section padding-bottom */
--space-md:       24px;     /* standard gap, container padding */
--space-sm:       12px;     /* tight spacing */
--space-xs:       8px;      /* minimal spacing */
```

**Rule:** Container max-width is `1080px` with `padding: 0 var(--space-md)` (24px sides).

```css
.container {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 var(--space-md);
}
```

---

## 4. Border Radius

```css
--radius:    8px;    /* cards, inputs, buttons */
--radius-sm: 6px;    /* nav links, small elements */
```

**Rule:** Pills (toggles, badges) use `border-radius: 100px`. Everything else uses 8px or 6px. Never 12px, 16px, or larger rounded corners.

---

## 5. Shadows

```css
/* Dark */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
--shadow-md: 0 2px 8px rgba(0,0,0,0.3);

/* Light */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
--shadow-md: 0 2px 8px rgba(0,0,0,0.04), 0 0 1px rgba(0,0,0,0.06);
```

**Rule:** Shadows are extremely subtle. Light mode shadows are almost invisible. Dark mode uses higher opacity since the background is black.

---

## 6. Transitions

```css
--ease:      200ms ease-out;
--ease-fast: 150ms ease-out;
```

**Rule:** Everything transitions. Background, color, border-color, box-shadow — all use `var(--ease)`. Interactive hover states use `var(--ease-fast)`. The page entrance is 400ms.

---

## 7. Typography Scale

All headings use negative letter-spacing. The tighter the spacing, the larger the text.

```css
/* H1 */ font-size: 40px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.1;
/* H2 */ font-size: 32px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.15;
/* H3 */ font-size: 24px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.2;
/* H4 */ font-size: 20px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.3;
/* H5 */ font-size: 16px; font-weight: 600; line-height: 1.4;
/* H6 */ font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
```

### Body Text

```css
/* Body Large */   font-size: 16px; line-height: 1.7; color: var(--text-secondary);
/* Body Default */ font-size: 14px; line-height: 1.6; color: var(--text-secondary);  /* base */
/* Body Small */   font-size: 13px; line-height: 1.5; color: var(--text-tertiary);
/* Caption */      font-size: 12px; line-height: 1.5; color: var(--text-tertiary);
/* Micro */        font-size: 11px; letter-spacing: 0.02em; color: var(--text-muted);
/* Paragraph */    font-size: 15px; line-height: 1.75; max-width: 600px;
```

**Rule:** Base body font-size is `14px`, not 16px. Headings are always `--text-primary`. Body text defaults to `--text-secondary`.

---

## 8. Buttons

Four variants. All share: `font-family: var(--font-sans)`, `font-size: 14px`, `padding: 10px 20px`, `border-radius: var(--radius)`, `display: inline-flex`, `align-items: center`, `gap: 8px`.

### Primary

```css
.btn-primary {
  background: var(--text-primary);    /* inverted — white on dark, black on light */
  color: var(--bg);
  font-weight: 600;
  border: none;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Theme-specific hover */
[data-theme="dark"] .btn-primary:hover  { background: #fff; }
[data-theme="light"] .btn-primary:hover { background: #171717; }
```

### Secondary

```css
.btn-secondary {
  background: transparent;
  color: var(--text-secondary);
  font-weight: 500;
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-md);
}
```

### Accent (Blue)

```css
.btn-accent {
  background: var(--accent);
  color: #fff;
  font-weight: 600;
}

.btn-accent:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,112,243,0.25);
}
```

### Success (Green)

```css
.btn-success {
  background: var(--success);
  color: #fff;
  font-weight: 600;
}

.btn-success:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
  box-shadow: 0 4px 12px rgba(0,200,83,0.2);
}
```

### Disabled State

```css
.btn-primary.disabled,
.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}
```

### Button Icons

SVG icons inside buttons are 14x14, stroke-based:

```css
.btn-primary svg {
  width: 14px; height: 14px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
```

---

## 9. Forms

### Input

```css
.form-input {
  padding: 10px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 14px;
  outline: none;
}

.form-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(0,112,243,0.1);    /* focus ring */
}

.form-input.error {
  border-color: var(--error);
}

.form-input.error:focus {
  box-shadow: 0 0 0 3px rgba(229,72,77,0.1);
}
```

### Toggle Switch

40x22 pill. Knob is 16x16 circle.

```css
.toggle {
  width: 40px; height: 22px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 100px;
}

.toggle.active {
  background: var(--accent);
  border-color: var(--accent);
}

.toggle::after {
  content: '';
  width: 16px; height: 16px;
  border-radius: 50%;
  background: var(--text-primary);
  top: 2px; left: 2px;
}

.toggle.active::after {
  transform: translateX(18px);
  background: #fff;
}
```

### Checkbox

18x18 square with 4px radius. Checked state uses `--accent` fill:

```css
.checkbox {
  width: 18px; height: 18px;
  border: 1px solid var(--border);
  border-radius: 4px;
}

.checkbox.checked {
  background: var(--accent);
  border-color: var(--accent);
}
```

Check icon: 12x12 SVG, stroke-width 2.5, white.

### Select

Custom styled native select:

```css
.form-select {
  appearance: none;
  padding: 10px 36px 10px 14px;   /* extra right padding for arrow */
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 14px;
}
```

Arrow icon positioned absolutely at `right: 12px`.

---

## 10. Global Reset & Rendering

```css
*, *::before, *::after {
  margin: 0; padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  background: var(--bg);
  overflow-x: hidden;
  transition: background var(--ease), color var(--ease);
}

::selection {
  background: var(--selection-bg);     /* rgba(0,112,243,0.25) dark / rgba(108,92,231,0.15) light */
  color: var(--selection-color);
}

a {
  color: inherit;
  text-decoration: none;
}
```

---

## 11. Responsive Breakpoints

### 768px (tablet)

- `--space-section` shrinks to 80px
- Skills grid: 2 columns
- Project rows: 2 columns (hide description + stack)
- Deploy rows: 3 columns (hide branch + time)
- Form grid: 1 column
- Hide nav breadcrumb (`nav-role`, `nav-slash`)

### 480px (mobile)

- `--space-section` shrinks to 64px
- Container padding: 16px
- Skills grid: 1 column
- Button rows stack vertically
- Footer stacks vertically
- Palette grid: 2 columns

---

## 12. SVG Icon Conventions

All icons are feather-style stroked SVGs:

```
viewBox="0 0 24 24"
fill="none"
stroke="currentColor"
stroke-width="2"
stroke-linecap="round"
stroke-linejoin="round"
```

Standard sizes:
- Button icons: 14x14
- Row action icons: 16x16
- Nav theme toggle icons: 14x14
- Dismiss (x) icons: 14x14 (stroke-width 2)
- Checkbox check: 12x12 (stroke-width 2.5)

---

## 13. Interaction Patterns Summary

| Element | Hover Effect |
|---------|-------------|
| Buttons | `translateY(-1px)` + shadow |
| Cards/Cells | `background: var(--bg-hover)` |
| Swatches | `translateY(-1px)` + `border-color: var(--border-hover)` |
| Nav links | `background: var(--bg-hover)` + `color: var(--text-primary)` |
| Rows (project/deploy) | Background fill via `::before` pseudo, extending beyond padding |
| Arrow icons | `translateX(3px)` + lighter stroke |
| Contact links | `color: var(--text-primary)` + arrow slides right 3px |
| Tags | `border-color: var(--border-hover)` + `color: var(--text-tertiary)` |

**Rule:** Hover states are always subtle. The largest movement is 1px vertical or 3px horizontal. No scale transforms, no color explosions.

---

## 14. Key Design Principles

1. **14px base** — Not 16px. Everything is one notch tighter than standard.
2. **Mono for metadata** — Any label, tag, timestamp, badge, or system text uses JetBrains Mono.
3. **Semi-transparent borders** — Never solid colored borders. Always `rgba()` with low opacity.
4. **Minimal shadows** — Almost invisible in light mode. Slightly heavier in dark mode.
5. **Negative letter-spacing on headings** — Gets tighter as size increases (-0.01em to -0.035em).
6. **Four-tier text hierarchy** — Primary, secondary, tertiary, muted. Use them consistently.
7. **Transition everything** — Every color, background, and border transitions on theme change and hover.
8. **Subtle hover states** — Max 1px vertical / 3px horizontal movement. No scale, no glow, no bounce.
9. **Dark mode is default** — Pure black. Light mode gets the prismatic gradient flair.
10. **1080px container** — Fixed max-width. Content never stretches wider.
