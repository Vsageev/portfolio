# Design System Guidelines

This document outlines the comprehensive design guidelines for the portfolio project, featuring a **Vercel-inspired (Geist)** design aesthetic. The philosophy centers on developer experience, high performance, and an "invisible" interface that lets content take center stage.

## Design Philosophy

Our design system embraces **Technical Minimalism** — a utilitarian approach that maintains focus through high contrast, clean typography, and purposeful layouts.

1.  **Content First**: The interface recedes to let the content (projects, deployments, metrics) shine.
2.  **High Contrast & Clarity**: Strict hierarchy using grayscale values to guide the eye.
3.  **Speed as a Feature**: Interfaces should feel instant. Animations are fast, subtle, and purely functional.
4.  **Developer Centric**: Extensive use of monospace fonts for technical data, clear borders, and organized information density.
5.  **Grid Precision**: Layouts align strictly to a pixel grid, creating a sense of stability and order.

## Color Palette

### Base Colors (Monochrome Foundation)
-   **Background**: `#FFFFFF` (White) - Main page background for maximum clarity.
-   **Foreground**: `#000000` (Black) - Primary text, headings, and primary action backgrounds.
-   **Accents-1**: `#FAFAFA` - Subtle backgrounds (page wash, code blocks).
-   **Accents-2**: `#EAEAEA` - Borders, dividers, and inactive states.
-   **Accents-5**: `#666666` - Secondary text, icons, and meta information.
-   **Accents-8**: `#111111` - Secondary headings, hover states for dark elements.

### Brand & Functional Colors
-   **Brand Blue**: `#0070F3` - Primary brand color, links, active states, information toasts.
-   **Success Green**: `#0070F3` (Brand) or `#27C93F` (Status) - "Ready" states, completion.
-   **Error Red**: `#EE0000` or `#FF0000` - Errors, failed deployments, critical warnings.
-   **Warning Yellow**: `#F5A623` - Alerts, building states.
-   **Purple**: `#7928CA` - Beta features, special highlights.

### Color Usage Guidelines

#### Background Strategy
-   **Dominant White**: `#FFFFFF` for cards and main content areas.
-   **Page Wash**: `#FAFAFA` (optional) for the body background to let white cards stand out.
-   **Borders**: Extensive use of `#EAEAEA` (1px) to define structure without heavy shadows.

#### Text Contrast
-   **Headings**: `#000000` for maximum impact.
-   **Body**: `#444444` or `#666666` for comfortable reading.
-   **Links**: `#0070F3` (Blue) on hover, `#000000` (Black) for navigation links.

## Typography

### Font Family
-   **Sans-serif**: `Geist Sans`, `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`.
-   **Monospace**: `Geist Mono`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, `monospace` (for code, IDs, commit hashes).

### Font Scales & Hierarchy
-   **Page Title**: `32px` (2rem), Bold (700), Tracking tight (`-0.02em`).
-   **Section Header**: `24px` (1.5rem), SemiBold (600).
-   **Sub-header**: `20px` (1.25rem), Medium (500).
-   **Body Large**: `16px` (1rem), Regular (400).
-   **Body Regular**: `14px` (0.875rem), Regular (400) - The standard UI font size.
-   **Small/Meta**: `12px` (0.75rem), Color `#666`.
-   **Mono**: `13px` - For technical details.

### Typography Guidelines
-   **Letter Spacing**: Tighter letter spacing on headings to mimic the "Geist" look.
-   **Line Height**: Relaxed for body text (1.5), tight for headings (1.2).
-   **Uppercase**: Used sparingly for small labels (Kicker), usually `11px` Bold with wide tracking.

## Motion & Microinteractions

### Interaction Feedback
**Trigger**: Hovering cards, clicking buttons, opening modals.

**Visual Response**:
-   **Duration**: Fast (`150ms` - `200ms`).
-   **Easing**: `ease-out` (starts fast, slows down).
-   **No Bounce**: Avoid bouncy or elastic effects. Motion should feel crisp and mechanical.

### Transition Examples
```css
.interactive-element {
  transition: all 150ms ease-out;
}
```

### Toast Notifications
-   **Slide Up**: Appears from bottom-right (or bottom-center).
-   **Blue Accent**: Use `#0070F3` background for informational updates (e.g., "Billing address updated").
-   **Contrast**: White text on Blue background.

## Layout & Focus Architecture

### Space Efficiency
-   **Container**: Max-width `1200px` centered.
-   **Grid System**: 12-column grid, or simpler flex/grid layouts with `24px` gaps.
-   **Card Padding**: Standard `24px` padding inside cards.

### Visual Hierarchy
1.  **Cards**: Content is grouped into white cards with `1px` `#EAEAEA` borders.
2.  **Shadows**: Minimal usage. Default is no shadow or very subtle (`0 2px 4px rgba(0,0,0,0.02)`).
3.  **Hover State**: Cards often "lift" slightly or the border turns dark (`#000`) on hover.

## Interactive Components

### Buttons
#### Primary Button (Black)
Used for the main action on the page (e.g., "Add New...", "Deploy").
```css
.btn-primary {
  background: #000000;
  color: #FFFFFF;
  border: 1px solid #000000;
  border-radius: 6px;
  padding: 0 16px;
  height: 40px; /* or 32px for small */
  font-weight: 500;
  font-size: 14px;
  transition: background 150ms ease, border-color 150ms ease;
}

.btn-primary:hover {
  background: #333333; /* Dark Gray */
  border-color: #333333;
}
```

#### Secondary Button (White)
Used for standard actions (e.g., "Cancel", "View Documentation").
```css
.btn-secondary {
  background: #FFFFFF;
  color: #000000;
  border: 1px solid #EAEAEA;
  border-radius: 6px;
  padding: 0 16px;
  height: 40px;
  font-weight: 500;
  font-size: 14px;
  transition: border-color 150ms ease;
}

.btn-secondary:hover {
  border-color: #000000;
}
```

### Cards & Hover Effects
Cards are the primary container for list items (projects, deployments).

#### Project Card
-   **Base**: White bg, `#EAEAEA` border, `6px` or `8px` radius.
-   **Content**: Title (Bold), Link (Gray), Icon (Black/White).
-   **Hover**: Border becomes `#000000` (Black).

```css
.card {
  background: #FFFFFF;
  border: 1px solid #EAEAEA;
  border-radius: 8px;
  padding: 24px;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.card:hover {
  border-color: #000000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
}
```

### Inputs & Forms
-   **Input Fields**: `#FAFAFA` or White background, `#EAEAEA` border.
-   **Focus**: `#000000` border or `#0070F3` outline.
-   **Labels**: Small, dark gray (`#666`), uppercase optional.

### Navigation (Tabs)
-   **Style**: Text-only tabs.
-   **Inactive**: `#666666`, no border.
-   **Active**: `#000000`, `2px` bottom border (black).
-   **Hover**: `#000000`.

## Accessibility

### Visual Accessibility
-   **Contrast**: Ensure `#666` text is only used on White backgrounds. Use `#444` for smaller text if needed to pass AA standards.
-   **Focus Rings**: distinct focus ring (often Blue `#0070F3` box-shadow) for keyboard navigation.

### Implementation Pattern
```tsx
// Card Component Example
export const Card = ({ title, children, href }) => {
  return (
    <div className="group border border-accents-2 rounded-lg p-6 bg-white hover:border-black transition-colors duration-150">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <div className="text-accents-5 text-sm">{children}</div>
    </div>
  );
};
```
