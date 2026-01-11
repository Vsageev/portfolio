# CodeRat Design Guidelines

This document outlines the comprehensive design guidelines for the CodeRat interactive Go programming platform, featuring a cheerful minimalism design philosophy that celebrates learning progress through thoughtful visual feedback and clean, focused interfaces.

## Design Philosophy

Our design system embraces **Cheerful Minimalism** — a balanced approach that maintains focus through clean, uncluttered interfaces while celebrating every learning milestone with joyful, proportional feedback. The core principles are:

1. **Efficient Space Usage**: Compact, purposeful layouts that maximize content density without sacrificing readability
2. **Progressive Feedback**: Every meaningful step is visually acknowledged with scaling intensity
3. **Consistent Restraint**: Base UI remains neutral and professional
4. **Joyful Moments**: Strategic use of animation and color to reinforce psychological progress
5. **Guided Learning**: Clear visual hierarchy that highlights cause and effect
6. **Accessible Motivation**: Visual rewards that encourage without overwhelming

## Color Palette

### Base Colors (Monochrome Neutrals)
- **Pure White:** `#FFFFFF` - Primary background for maximum content clarity
- **Light Gray:** `#F8F9FA` - Subtle section backgrounds and card surfaces
- **Medium Gray:** `#E9ECEF` - Borders, dividers, and inactive states
- **Soft Charcoal:** `#6C757D` - Secondary text and subtle UI elements
- **Deep Charcoal:** `#343A40` - Primary text for optimal readability

### Accent Colors (Bright & Cheerful)
- **Electric Blue:** `#007BFF` - Primary interactive elements, progress indicators
- **Lime Green:** `#28A745` - Success states, completed tasks, checkmarks
- **Coral Orange:** `#FD7E14` - Warning states, hints, moderate achievements
- **Sunflower Yellow:** `#FFC107` - Caution states, draft indicators, attention grabbers

### Semantic Feedback Colors
- **Success Green:** `#20C997` - Task completion, correct answers
- **Error Red:** `#DC3545` - Compilation errors, incorrect solutions
- **Info Blue:** `#17A2B8` - Tips, information panels, neutral feedback
- **Progress Purple:** `#6F42C1` - Learning streaks, advanced achievements

### Color Usage Guidelines

#### Background Strategy
- **Dominant White**: Creates maximum contrast and reading comfort
- **Subtle Gray Variations**: Use `#F8F9FA` for card backgrounds and section separators
- **No Dark Themes**: Light backgrounds optimize code readability and reduce eye strain during learning

#### Interactive Elements
- **Primary Actions**: Electric blue (`#007BFF`) for buttons, links, and main CTAs
- **Success Feedback**: Lime green (`#28A745`) for completed steps and positive reinforcement
- **Attention Elements**: Coral orange (`#FD7E14`) for hints, tips, and moderate progress
- **Caution States**: Sunflower yellow (`#FFC107`) for warnings and important notices

#### Feedback Intensity Scaling
- **Minor Progress**: Soft color highlights with 20% opacity overlays
- **Moderate Achievements**: Medium intensity with 60% opacity and gentle transitions
- **Major Milestones**: Full color intensity with vibrant animations and effects

## Typography

### Font Family
- **Primary Font**: 'Inter' with system font stack fallbacks to sans-serif
- **Display Font**: 'Space Grotesk' for headers and prominent text
- **Monospace Font**: 'SF Mono' for code and technical content
- **Weight Variation**: Regular (400), Medium (500), and Bold (700) weights for hierarchy

### Font Scales & Hierarchy
- **Hero Title**: `32px` (2rem) - Main page headers, course titles
- **Section Header**: `24px` (1.5rem) - Task titles, major section headings
- **Sub-header**: `20px` (1.25rem) - Card titles, step headers
- **Body Large**: `18px` (1.125rem) - Important content, instructions
- **Body Regular**: `16px` (1rem) - Standard content, descriptions
- **Body Small**: `14px` (0.875rem) - Secondary information, metadata
- **Caption**: `12px` (0.75rem) - Labels, timestamps, micro-content

### Typography Guidelines
- **Line Height**: Compact line heights (1.4-1.5 for body text, 1.1-1.2 for headings) to maximize vertical space efficiency
- **Font Weight**: 400 (regular), 500 (medium), 600 (semi-bold), 700 (bold)
- **Color Contrast**: Minimum 4.5:1 ratio for body text, 3:1 for large text
- **Code Formatting**: Always use monospace with syntax highlighting
- **Reading Experience**: Optimal line length of 60-75 characters, but prioritize showing more content on screen
- **Tight Paragraph Spacing**: Use minimal spacing between paragraphs (0.5-0.75em) to reduce vertical scrolling

## Motion & Microinteractions

### Small Progress Feedback
**Trigger**: Minor completions (typing code, following hints, small steps)

**Visual Response**:
- Subtle fade-in animations (200ms ease-out)
- Soft color highlights with 20% opacity
- Tiny floating checkmarks (↗ 8px movement)
- Progress bar increments with smooth transitions

```css
.minor-success {
  animation: gentle-glow 300ms ease-out;
  box-shadow: 0 0 0 4px rgba(40, 167, 69, 0.2);
}

@keyframes gentle-glow {
  0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.2); }
  50% { box-shadow: 0 0 0 4px rgba(40, 167, 69, 0.4); }
  100% { box-shadow: 0 0 0 4px rgba(40, 167, 69, 0.2); }
}
```

### Moderate Achievement Feedback
**Trigger**: Task completions, streak milestones, correct solutions

**Visual Response**:
- Animated color sweeps (400ms duration)
- Soft animated streaks or progress fills
- Badge appearances with smooth fade-in
- Color transitions from neutral to accent

```css
.moderate-achievement {
  animation: success-sweep 500ms ease-out;
  background: linear-gradient(45deg, #28A745, #20C997);
}

@keyframes success-sweep {
  0% { opacity: 0.8; background-position: -100% 0; }
  50% { opacity: 1; background-position: 0% 0; }
  100% { opacity: 1; background-position: 100% 0; }
}
```

### Major Milestone Celebration
**Trigger**: Course completions, significant achievements, perfect scores

**Visual Response**:
- Confetti burst animations (600ms duration)
- Vibrant color cascades
- Animated badges with smooth rotation
- Celebratory color sweeps across interface
- Sound-friendly visual cues (accessibility)

```css
.major-celebration {
  animation: celebration-shine 800ms ease-out;
}

@keyframes celebration-shine {
  0% { opacity: 0.8; filter: brightness(1) hue-rotate(0deg); }
  25% { opacity: 1; filter: brightness(1.2) hue-rotate(5deg); }
  50% { opacity: 1; filter: brightness(1.1) hue-rotate(-2deg); }
  100% { opacity: 1; filter: brightness(1) hue-rotate(0deg); }
}
```

### Continuous Feedback Principles
- **Every Action Counts**: Even minor interactions trigger micro-feedback
- **Proportional Response**: Animation intensity matches achievement importance
- **Non-Disruptive**: Celebrations enhance rather than interrupt learning flow
- **Consistent Timing**: Use standard duration scales (200ms, 400ms, 600ms)
- **Performance Optimized**: Use CSS color, opacity, and filter changes for smooth 60fps animations
- **Stable Movement**: Avoid scaling, bouncing, or wiggling effects that can distract from content
- **No Elevation Movement**: UI elements should not move up/down (translateY) on hover to maintain interface stability and prevent content shifting
- **No Scaling Effects**: Avoid scale transformations on UI elements to prevent layout shifts and maintain visual stability

## Layout & Focus Architecture

### Space Efficiency Strategy
- **Compact Layouts**: Maximize content density while maintaining visual clarity and readability
- **Purposeful Spacing**: Use minimal, calculated spacing that serves clear functional purposes
- **Content Padding**: Efficient padding (12-16px) around main content areas, reserving larger margins (24px) only for major page boundaries
- **Section Spacing**: Tight section spacing (24-32px) between major content sections to reduce scrolling
- **Element Spacing**: Compact spacing (8-12px) between related elements, 16-20px between distinct groups
- **Vertical Rhythm**: Consistent, tight vertical rhythm using multiples of 4px or 8px for predictable, efficient layouts
- **Reading Comfort**: Optimal line length of 60-75 characters, but prioritize showing more content on screen
- **No Wasted Space**: Every pixel should serve a purpose—eliminate unnecessary margins, padding, and gaps
- **Dense Information Display**: Group related information tightly; use visual hierarchy (typography, color) rather than spacing to create separation

### Compact UI Patterns

#### Space-Saving Techniques
- **Collapsible Sections**: Use accordions and collapsible panels for optional or secondary content
- **Inline Labels**: Place labels inline with inputs rather than above them when space is limited
- **Compact Tables**: Use tight cell padding (4-8px) and minimal row spacing for data-dense tables
- **Stacked Elements**: Vertically stack related elements with minimal gaps (4-8px) instead of horizontal layouts
- **Multi-purpose Components**: Design components that serve multiple functions to reduce UI footprint
- **Progressive Disclosure**: Hide advanced options by default; reveal on demand to keep interfaces compact
- **Efficient Grids**: Use tight grid gaps (8-12px) and maximize column usage within viewport constraints
- **Compact Forms**: Group form fields tightly; use single-row layouts for related inputs (e.g., first name + last name)

#### Density Guidelines
- **Minimum Touch Targets**: Maintain 44x44px minimum for touch targets, but reduce padding around them
- **Content-First Layouts**: Prioritize content visibility over decorative spacing
- **Efficient Navigation**: Use compact navigation patterns (tabs, pills) instead of large menu items
- **Condensed Lists**: Reduce list item padding (8-12px vertical) while maintaining readability
- **Tight Card Layouts**: Use minimal card padding (12-16px) and compact internal spacing

### Progress Integration Patterns

#### Status Indicators
- **Inline Progress**: Integrated naturally within content flow with minimal spacing
- **Sidebar Progress**: Persistent but non-intrusive progress tracking in compact sidebars
- **Step Indicators**: Clear visual progression through learning paths with tight spacing between steps

#### Learning Path Visualization
- **Linear Progression**: Clear next/previous navigation
- **Milestone Markers**: Major achievements highlighted in timeline
- **Current Focus**: Active learning area prominently highlighted

### Guided Focus System

#### Content Hierarchy
```
1. Active Learning Area (Primary Focus)
   ├── Current instruction/exercise
   ├── Code editor (when applicable)
   └── Immediate feedback zone

2. Supporting Information (Secondary)
   ├── Progress indicators
   ├── Navigation elements
   └── Reference materials

3. Contextual Elements (Tertiary)
   ├── Achievement displays
   ├── Secondary navigation
   └── Optional tools
```

#### Visual Focus Techniques
- **Spotlight Effect**: Subtle highlighting of current learning area
- **Progressive Disclosure**: Show only relevant information for current step
- **Context Preservation**: Keep related information visible but de-emphasized
- **Clear Transitions**: Smooth focus shifts between learning sections

## Interactive Components

### Buttons & Controls

#### Primary Action Buttons
```css
.primary-button {
  background: #007BFF;
  color: white;
  padding: 8px 16px;  /* Compact padding for efficient space usage */
  border-radius: 6px;
  font-weight: 600;
  transition: all 200ms ease;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
}

.primary-button:hover {
  background: #0056B3;
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
}
```

#### Success Feedback Buttons
```css
.success-button {
  background: #28A745;
  color: white;
  animation: success-pulse 2s infinite;
}

@keyframes success-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(40, 167, 69, 0); }
}
```

#### Start Button Hover Sweep
- **Base State**: White background, deep-charcoal text, subtle 1px medium-gray border.
- **Hover Effect**: A black sweep fills left→right over ~400ms; text switches to white; border becomes black. No scaling.
- **Implementation**: Use a layered background so text stays readable during the transition.

```css
.start-button {
  background: linear-gradient(90deg, #000, #000) no-repeat 0 0 / 0% 100%, var(--pure-white);
  color: var(--deep-charcoal);
  border: 1px solid var(--medium-gray);
  transition: background-size 400ms ease, color 200ms ease, border-color 200ms ease;
}

.start-button:hover {
  color: var(--pure-white);
  border-color: #000;
  background-size: 100% 100%, auto;
}
```

### Cards & Hover Borders

#### Card Hover Gradient Border
- **Base State**: Neutral card with `1px` border in `--medium-gray`, rounded corners (`--radius-lg`), clean surface.
- **Hover Effect**: A symmetric gradient border appears and the gradient itself spins for the first **500ms**. The border element remains static.
- **Thickness**: Default `2.5px` (recommended range: `1px–4px`).
- **Palette**: Use vibrant accents for celebratory feel:
  - `--electric-blue → --sunflower-yellow → --coral-orange → --progress-purple → --electric-blue`.
- **Motion Rule**: Animate only the gradient angle; do not rotate/scale the card or border. One full rotation (`360deg`) over `500ms`, no infinite loop by default.
- **Performance**: Animate a CSS custom property for smooth, GPU-friendly rendering. Gracefully degrade to a static gradient if unsupported.

```css
/* Base card */
.card {
  background: var(--pure-white);
  border: 1px solid var(--medium-gray);
  border-radius: var(--radius-lg);
  position: relative;
  overflow: hidden;
}

/* Gradient border via masked pseudo-element */
.card::before {
  content: '';
  position: absolute;
  inset: -1px;               /* sit just outside border box */
  border-radius: inherit;
  padding: 2.5px;              /* border thickness */
  --angle: 0deg;             /* animatable angle */
  background: conic-gradient(
    from var(--angle),
    var(--electric-blue),
    var(--sunflower-yellow),
    var(--coral-orange),
    var(--progress-purple),
    var(--electric-blue)
  );
  /* cut out the middle so only the ring shows */
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask:          linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity var(--duration-fast) ease;
  pointer-events: none;
}

.card:hover::before {
  opacity: 1;
  animation: spin-angle 500ms linear forwards; /* gradient spins, border stays */
}

@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@keyframes spin-angle { to { --angle: 360deg; } }
```

Notes:
- Prefer single-pass spin on hover; use `infinite` only for special contexts.
- Keep base UI neutral; reserve vivid gradients for interactive moments.

### Progress Components

#### Linear Progress Bars
```css
.progress-container {
  background: #E9ECEF;
  border-radius: 8px;
  overflow: hidden;
  height: 8px;
}

.progress-fill {
  background: linear-gradient(90deg, #007BFF, #0056B3);
  height: 100%;
  transition: width 400ms ease-out;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  animation: shimmer 1.5s infinite;
}
```


### Code Interface Elements

#### Editor Integration
- **Syntax Highlighting**: Consistent with popular Go themes
- **Line Numbers**: Subtle gray, non-distracting
- **Current Line**: Soft highlight without interrupting focus
- **Error Indicators**: Red underlines with tooltip explanations
- **Success Highlights**: Green line backgrounds for correct solutions


### Navigation Patterns
- **Previous/Next**: Obvious progression through lessons
- **Quick Access**: Recent lessons and bookmarked content

## Accessibility & Inclusive Design

### Visual Accessibility
- **High Contrast**: All text meets WCAG AA standards (4.5:1 minimum)
- **Color Independence**: Information never conveyed by color alone
- **Focus Indicators**: Clear, high-contrast focus rings on all interactive elements
- **Text Scaling**: Interface remains functional at 200% zoom

### Cognitive Accessibility
- **Clear Language**: Simple, direct instructions without jargon
- **Consistent Patterns**: Predictable interface behavior throughout
- **Progress Clarity**: Always show current position and next steps
- **Error Prevention**: Helpful validation and clear error messages
- **Undo Options**: Easy recovery from mistakes

### Development Patterns
```typescript
// Feedback Component Pattern
interface FeedbackProps {
  type: 'minor' | 'moderate' | 'major';
  message: string;
  duration?: number;
}

const Feedback: React.FC<FeedbackProps> = ({ type, message, duration = 2000 }) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <div className={`feedback feedback--${type} ${visible ? 'visible' : ''}`}>
      {message}
    </div>
  );
};
```
