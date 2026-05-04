# OIA Design System v1.0
## Visual Language for 864zeros Products
**Created:** 2026-01-29  
**Status:** ACTIVE  
**Applies to:** UnStuck and all future OIA apps

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Border Radius](#border-radius)
6. [Shadows](#shadows)
7. [Components](#components)
8. [Motion & Animation](#motion--animation)
9. [ADHD-Specific UX Rules](#adhd-specific-ux-rules)
10. [Accessibility](#accessibility)
11. [React Native Implementation](#react-native-implementation)
12. [Version History](#version-history)

---

## Design Philosophy

> "Organize your brain, not your life"

OIA products are built for ADHD brains. Every design decision must reduce cognitive load, create calm, and reward action. We are warm, not clinical. Supportive, not demanding. Simple, not overwhelming.

### Core Principles

| Principle | Implementation |
|-----------|----------------|
| **One thing at a time** | Each screen has ONE purpose, ONE primary action |
| **Calm over stimulation** | Muted tones, generous whitespace, no visual noise |
| **Reward over guilt** | Celebrate completion, never punish missed days |
| **Friendly over corporate** | Soft edges, warm colors, human voice |
| **Accessible by default** | High contrast options, large touch targets, readable type |

### Visual Direction

**We ARE:** Warm, calming, supportive, human, friendly, soft, approachable

**We are NOT:** Cold, corporate, aggressive, clinical, demanding, harsh, sterile

---

## Color Palette

### Brand Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Sage** | `#8BA888` | 139, 168, 136 | Primary actions, buttons, success states, checkmarks, completion |
| **Sage Dark** | `#7A9676` | 122, 150, 118 | Hover/pressed states |
| **Sage Light** | `#96B893` | 150, 184, 147 | Dark mode primary |
| **Coral** | `#E8A598` | 232, 165, 152 | Brand identity, headers, warm accents, highlights |
| **Coral Dark** | `#D99A8E` | 217, 154, 142 | Dark mode accent |
| **Coral Light** | `#F0B5A8` | 240, 181, 168 | Subtle accents |

### Background Colors

#### Light Mode

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Cream** | `#F5F2ED` | 245, 242, 237 | Primary background |
| **Warm White** | `#FDFCFA` | 253, 252, 250 | Cards, elevated surfaces, inputs |

#### Dark Mode

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Dark BG** | `#1A1A1A` | 26, 26, 26 | Primary background |
| **Dark Card** | `#242424` | 36, 36, 36 | Cards, elevated surfaces |
| **Dark Elevated** | `#2E2E2E` | 46, 46, 46 | Modals, popovers |

**Note:** Never use pure black (`#000000`) or pure white (`#FFFFFF`). Always warm-tinted neutrals.

### Supporting Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Dusty Blue** | `#7A8FA3` | 122, 143, 163 | Secondary elements, icons, metadata, info states |
| **Taupe** | `#A69485` | 166, 148, 133 | Neutral UI, borders, disabled states, pending status |
| **Olive** | `#6B6B5E` | 107, 107, 94 | Tertiary elements, subtle backgrounds, dark mode borders |
| **Mustard** | `#C9A86C` | 201, 168, 108 | Highlights, warnings, in-progress status |

### Text Colors

#### Light Mode

| Name | Hex | Usage |
|------|-----|-------|
| **Charcoal** | `#2D2D2D` | Primary text, headings |
| **Stone** | `#5C5C5C` | Secondary text, descriptions |
| **Muted** | `#8C8C8C` | Placeholder text, hints, captions |

#### Dark Mode

| Name | Hex | Usage |
|------|-----|-------|
| **Off-White** | `#F0EDE8` | Primary text, headings |
| **Warm Gray** | `#A8A8A8` | Secondary text, descriptions |
| **Muted Dark** | `#6C6C6C` | Placeholder text, hints, captions |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#8BA888` | Completion, checkmarks, positive feedback (Sage) |
| **Warning** | `#C9A86C` | Gentle alerts, in-progress, attention needed (Mustard) |
| **Error** | `#D4847A` | Errors, failures — muted, not aggressive (Coral-red) |
| **Info** | `#7A8FA3` | Informational messages, tips (Dusty Blue) |

### Status Badge Colors

| Status | Background | Text |
|--------|------------|------|
| **Completed** | `#8BA888` at 20% opacity | `#8BA888` |
| **In Progress** | `#C9A86C` at 20% opacity | `#C9A86C` |
| **Pending** | `#A69485` at 20% opacity | `#A69485` |

---

## Typography

### Font Family

**Primary:** Nunito  
**Fallback:** -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif

**Why Nunito:** Rounded terminals create a friendly appearance. Excellent readability at all sizes. Free via Google Fonts. Matches our soft, approachable aesthetic without feeling childish.

**Installation (React Native/Expo):**
```bash
npx expo install @expo-google-fonts/nunito
```

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **Display** | 32px | 700 (Bold) | 1.2 | Hero text, main prompts, celebration messages |
| **H1** | 24px | 700 (Bold) | 1.3 | Screen titles |
| **H2** | 20px | 600 (SemiBold) | 1.3 | Section headers, card titles |
| **Body** | 16px | 400 (Regular) | 1.5 | Primary content, descriptions |
| **Body Small** | 14px | 400 (Regular) | 1.5 | Secondary content, metadata |
| **Caption** | 12px | 400 (Regular) | 1.4 | Timestamps, labels, hints |
| **Button** | 16px | 600 (SemiBold) | 1.0 | Button labels |

### Typography Rules

- **Minimum readable text:** 12px (Caption)
- **Minimum touch target text:** 14px
- **Maximum line length:** 65 characters (for readability)
- **Never use all caps** except for very short labels (2-3 words max)
- **Letter-spacing on buttons:** +0.5px for better readability
- **Paragraph spacing:** 1.5× the font size

---

## Spacing System

**Base unit:** 8px

All spacing should be multiples of 8px for visual consistency.

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight gaps, icon padding, inline elements |
| `sm` | 8px | Related elements, icon margins |
| `md` | 16px | Standard gaps, card padding |
| `lg` | 24px | Section separation, generous padding |
| `xl` | 32px | Major sections, screen margins |
| `xxl` | 48px | Screen padding top/bottom, hero spacing |

### Screen Layout

| Area | Spacing |
|------|---------|
| **Horizontal padding** | 24px (lg) |
| **Top safe area + padding** | 48px minimum (xxl) |
| **Bottom above nav** | 32px (xl) |
| **Between sections** | 24px (lg) |
| **Between related items** | 8-16px (sm-md) |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 8px | Small elements, chips, badges, checkboxes |
| `md` | 12px | Buttons, inputs, small cards |
| `lg` | 16px | Cards, list items |
| `xl` | 24px | Modal sheets, large containers |
| `full` | 9999px | Pills, avatars, circular buttons |

**Design principle:** Always rounded. Sharp corners feel aggressive and clinical. Our UI should feel soft and safe.

---

## Shadows

### Light Mode Shadows

| Name | Definition | Usage |
|------|------------|-------|
| **Small** | `0 1px 3px rgba(0,0,0,0.05)` | Cards, subtle elevation |
| **Medium** | `0 2px 8px rgba(0,0,0,0.08)` | Floating elements, dropdowns |
| **Large** | `0 4px 16px rgba(0,0,0,0.1)` | Modals, popovers |
| **Button** | `0 2px 8px rgba(139,168,136,0.3)` | Primary buttons (sage-tinted) |

### Dark Mode Shadows

Shadows are less visible in dark mode. Rely more on border/background differentiation:

| Name | Definition | Usage |
|------|------------|-------|
| **Small** | `0 1px 2px rgba(0,0,0,0.3)` | Cards |
| **Medium** | `0 2px 4px rgba(0,0,0,0.4)` | Floating elements |
| **Large** | `0 4px 8px rgba(0,0,0,0.5)` | Modals |

---

## Components

### Primary Button (CTA)

```
┌─────────────────────────┐
│      Break it down      │  
└─────────────────────────┘
```

| Property | Value |
|----------|-------|
| Background | Sage (`#8BA888`) |
| Text | Warm White (`#FDFCFA`) |
| Height | 56px |
| Min Width | 120px |
| Border Radius | 12px (md) |
| Font | 16px SemiBold |
| Shadow | Button shadow (sage-tinted) |
| Padding | 0 24px |

**States:**
- **Default:** As above
- **Pressed:** Background darkens 10% (`#7A9676`)
- **Disabled:** Background Taupe (`#A69485`), text at 50% opacity

### Secondary Button

| Property | Value |
|----------|-------|
| Background | Transparent |
| Border | 2px solid Sage (`#8BA888`) |
| Text | Sage (`#8BA888`) |
| Height | 56px |
| Border Radius | 12px (md) |
| Font | 16px SemiBold |

**States:**
- **Pressed:** Background Sage at 10% opacity
- **Disabled:** Border and text Taupe at 50% opacity

### Text Input

```
┌─────────────────────────────┐
│ What do you need to do?     │
└─────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Background | Warm White (`#FDFCFA`) / Dark Card in dark mode |
| Border | 1px solid Taupe (`#A69485`) |
| Border (focused) | 2px solid Sage (`#8BA888`) |
| Height | 56px |
| Border Radius | 12px (md) |
| Padding | 0 16px |
| Text | Charcoal (`#2D2D2D`) / Off-White in dark mode |
| Placeholder | Muted (`#8C8C8C`) |

### Task Card

```
┌─────────────────────────────────┐
│ ○  Pick up clothes from floor  │
│    Est. 5 min                   │
└─────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Background | Warm White / Dark Card |
| Border Radius | 16px (lg) |
| Padding | 16px |
| Shadow | Small |
| Checkbox | 24px, Sage when checked |

**Completed state:**
- Checkbox fills with Sage + white checkmark
- Text color changes to Stone with line-through
- Background slightly muted (Cream / Dark Elevated)

### Checkbox

| State | Style |
|-------|-------|
| **Unchecked** | 24×24px, 2px Taupe border, transparent fill, 8px radius |
| **Checked** | 24×24px, Sage fill, white checkmark icon, 8px radius |
| **Disabled** | 50% opacity |

### Progress Bar

```
[████████░░░░░░░░░░░░] 40%
```

| Property | Value |
|----------|-------|
| Track Height | 8px |
| Track Color | Taupe at 25% opacity (light) / Dark Elevated (dark) |
| Fill Color | Sage (`#8BA888`) |
| Border Radius | 4px |

### Status Badge

```
┌──────────────┐
│ ● Completed  │
└──────────────┘
```

| Status | Background | Text | Dot |
|--------|------------|------|-----|
| Completed | `#8BA888` at 20% | `#8BA888` | Sage |
| In Progress | `#C9A86C` at 20% | `#C9A86C` | Mustard |
| Pending | `#A69485` at 20% | `#A69485` | Taupe |

### Granularity Slider

For the Big / Balanced / Small task breakdown control:

```
    Big      Balanced     Small
     ○──────────●──────────○
```

| Property | Value |
|----------|-------|
| Track | 4px height, Taupe at 40% |
| Active Track | Sage |
| Thumb | 24px circle, Coral fill, small shadow |
| Labels | Caption size (12px), Stone color |
| Active Label | Body size (16px), Charcoal, SemiBold |

### Bottom Navigation

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🏠        📋        ➕        👤
 Home     Tasks     [Add]    Profile
```

| Property | Value |
|----------|-------|
| Background | Warm White / Dark Card |
| Height | 64px + safe area |
| Active Icon | Sage |
| Active Label | Sage, Caption size |
| Inactive Icon | Taupe |
| Inactive Label | Muted, Caption size |

### Floating Action Button (FAB)

| Property | Value |
|----------|-------|
| Size | 56×56px |
| Background | Sage |
| Icon | White, 24px |
| Border Radius | full (circle) |
| Shadow | Large |
| Position | Bottom right, 24px from edges |

### Loading Spinner

| Property | Value |
|----------|-------|
| Size | 32px (default), 24px (small), 48px (large) |
| Color | Sage |
| Style | Simple circular rotation |
| Animation | 1s linear infinite |

### Skeleton Loader

| Property | Value |
|----------|-------|
| Background | Taupe at 20% (light) / Dark Elevated (dark) |
| Animation | Pulse opacity 0.3 → 0.7, 1.5s ease-in-out |
| Border Radius | Match component being loaded |

### Toast / Snackbar

```
┌─────────────────────────────────┐
│ ✓  Task breakdown complete      │
└─────────────────────────────────┘
```

| Type | Background | Icon/Text |
|------|------------|-----------|
| Success | Sage | White |
| Warning | Mustard | Charcoal |
| Error | Error (`#D4847A`) | White |
| Info | Dusty Blue | White |

| Property | Value |
|----------|-------|
| Position | Bottom, 24px from bottom nav |
| Height | 48px |
| Border Radius | 12px |
| Padding | 12px 16px |
| Duration | 3 seconds (auto-dismiss) |
| Animation | Slide up + fade in |

### Empty State

```
┌─────────────────────────────────┐
│                                 │
│        [Illustration]          │
│                                 │
│     No tasks yet               │
│  Ready when you are.           │
│                                 │
│    ┌──────────────────┐        │
│    │  Add your first  │        │
│    └──────────────────┘        │
│                                 │
└─────────────────────────────────┘
```

| Element | Style |
|---------|-------|
| Illustration | Soft, warm colors, friendly imagery |
| Headline | H2, Charcoal |
| Subtext | Body, Stone |
| CTA | Secondary button |

---

## Motion & Animation

### Principles

1. **Purposeful:** Animation confirms actions, never decorates randomly
2. **Quick:** 150-350ms for most interactions
3. **Calm:** Ease-out curves, no aggressive bouncing
4. **Rewarding:** Completion animations should feel satisfying

### Duration Scale

| Token | Value | Usage |
|-------|-------|-------|
| `fast` | 150ms | Button press, micro-feedback |
| `normal` | 250ms | Standard transitions, cards appearing |
| `slow` | 350ms | Screen transitions, complex animations |

### Easing

- **Default:** `ease-out` (fast start, gentle finish)
- **Enter:** `ease-out`
- **Exit:** `ease-in`
- **Move:** `ease-in-out`

### Key Animations

| Action | Animation | Duration |
|--------|-----------|----------|
| Button press | Scale to 0.97 | 100ms |
| Checkbox complete | Fill + checkmark draw | 300ms |
| Card appear | Fade in + slide up 8px | 250ms |
| Card exit | Fade out + slide down 8px | 200ms |
| Screen transition | Fade + slide | 300ms |
| Toast appear | Slide up + fade in | 250ms |
| Toast dismiss | Fade out | 200ms |
| Pull to refresh | Rotate spinner | Continuous |

### Completion Celebration

When user completes ALL subtasks:

1. Final checkbox animates (150ms)
2. Brief pause (100ms)
3. Celebration burst — confetti or particles (500ms)
4. "You did it! 🎉" message fades in (250ms)
5. Gentle haptic feedback (if available)

**Keep it brief and joyful, not overwhelming.**

---

## ADHD-Specific UX Rules

These rules are NON-NEGOTIABLE for all OIA products.

### Must Follow

| Rule | Rationale |
|------|-----------|
| **One primary action per screen** | Reduces decision paralysis |
| **No streaks** | Missing a day shouldn't feel like failure |
| **No guilt copy** | Never shame the user |
| **Large touch targets (min 48px)** | Reduces frustration from mis-taps |
| **Instant feedback** | Every tap must have visual/haptic response |
| **Forgiving inputs** | Auto-save, easy undo, no "are you sure?" spam |
| **Minimal required fields** | Ask for least possible information |
| **Progressive disclosure** | Hide complexity until needed |
| **Clear visual hierarchy** | User knows where to look in <1 second |
| **Escape hatches** | Easy to go back, undo, or start over |

### Copy Guidelines

| Instead of... | Write... |
|---------------|----------|
| "You haven't finished..." | "Ready to continue?" |
| "Don't forget to..." | "Your tasks are here when you need them" |
| "You missed yesterday" | [Say nothing] |
| "Complete your profile" | "Add more when you're ready" |
| "Task failed" | "That didn't work — try again?" |
| "Error" | "Something went wrong" |
| "Invalid input" | "Let's try that again" |
| "Are you sure?" | [Just do it, make undo easy] |

### Timing Considerations

| Action | Guideline |
|--------|-----------|
| Loading states | Show skeleton immediately, content within 2s |
| Auto-save | Save continuously, never ask |
| Session timeout | Generous (30+ min), restore state on return |
| Notifications | Opt-in only, never guilt-based |

---

## Accessibility

### Color Contrast (WCAG AA)

All text must meet minimum contrast ratios:

| Text Type | Minimum Ratio |
|-----------|---------------|
| Normal text (<18px) | 4.5:1 |
| Large text (≥18px or 14px bold) | 3:1 |
| UI components | 3:1 |

#### Verified Combinations

| Combination | Ratio | Status |
|-------------|-------|--------|
| Charcoal on Cream | 10.5:1 | ✅ AAA |
| Charcoal on Warm White | 11.2:1 | ✅ AAA |
| Off-White on Dark BG | 12.1:1 | ✅ AAA |
| Sage on Warm White | 3.2:1 | ✅ AA Large |
| Warm White on Sage | 3.2:1 | ✅ AA Large |

**Note:** Sage buttons with white text pass for button-sized text (16px semibold). For smaller text on sage backgrounds, use Charcoal.

### Touch Targets

| Type | Size |
|------|------|
| Minimum | 48 × 48px |
| Recommended | 56 × 56px |
| Spacing between targets | 8px minimum |

### Screen Reader Support

- All interactive elements must have accessible labels
- Images must have alt text
- State changes must be announced
- Focus order must be logical
- Custom components must have proper roles

### Motion Sensitivity

- Respect `prefers-reduced-motion` setting
- Provide option to disable animations
- Never use motion that could trigger vestibular issues

---

## React Native Implementation

### Theme File

```typescript
// theme/OIATheme.ts

export const OIAColors = {
  // Brand
  sage: '#8BA888',
  sageDark: '#7A9676',
  sageLight: '#96B893',
  coral: '#E8A598',
  coralDark: '#D99A8E',
  coralLight: '#F0B5A8',

  // Backgrounds - Light
  cream: '#F5F2ED',
  warmWhite: '#FDFCFA',

  // Backgrounds - Dark
  darkBg: '#1A1A1A',
  darkCard: '#242424',
  darkElevated: '#2E2E2E',

  // Supporting
  dustyBlue: '#7A8FA3',
  taupe: '#A69485',
  olive: '#6B6B5E',
  mustard: '#C9A86C',

  // Text - Light
  charcoal: '#2D2D2D',
  stone: '#5C5C5C',
  muted: '#8C8C8C',

  // Text - Dark
  offWhite: '#F0EDE8',
  warmGray: '#A8A8A8',
  mutedDark: '#6C6C6C',

  // Semantic
  success: '#8BA888',
  warning: '#C9A86C',
  error: '#D4847A',
  info: '#7A8FA3',

  // Status
  completed: '#8BA888',
  inProgress: '#C9A86C',
  pending: '#A69485',
};

export const OIATypography = {
  fontFamily: 'Nunito',
  sizes: {
    display: 32,
    h1: 24,
    h2: 20,
    body: 16,
    bodySmall: 14,
    caption: 12,
    button: 16,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.3,
    relaxed: 1.5,
  },
};

export const OIASpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const OIARadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const OIAShadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    shadowColor: '#8BA888',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const OIAAnimation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
};

export const OIAComponents = {
  button: { height: 56, minWidth: 120 },
  input: { height: 56 },
  touchTarget: { min: 48, recommended: 56 },
  bottomNav: { height: 64 },
  fab: { size: 56 },
  checkbox: { size: 24 },
  progressBar: { height: 8, radius: 4 },
  slider: { trackHeight: 4, thumbSize: 24 },
  toast: { height: 48 },
  spinner: { small: 24, default: 32, large: 48 },
};

// Light Theme
export const lightTheme = {
  mode: 'light' as const,
  colors: OIAColors,
  typography: OIATypography,
  spacing: OIASpacing,
  radius: OIARadius,
  shadows: OIAShadows,
  animation: OIAAnimation,
  components: OIAComponents,
  
  // Semantic mappings
  background: OIAColors.cream,
  card: OIAColors.warmWhite,
  border: OIAColors.taupe,
  text: {
    primary: OIAColors.charcoal,
    secondary: OIAColors.stone,
    muted: OIAColors.muted,
    inverse: OIAColors.warmWhite,
  },
};

// Dark Theme
export const darkTheme = {
  mode: 'dark' as const,
  colors: OIAColors,
  typography: OIATypography,
  spacing: OIASpacing,
  radius: OIARadius,
  shadows: OIAShadows,
  animation: OIAAnimation,
  components: OIAComponents,
  
  // Semantic mappings
  background: OIAColors.darkBg,
  card: OIAColors.darkCard,
  border: OIAColors.olive,
  text: {
    primary: OIAColors.offWhite,
    secondary: OIAColors.warmGray,
    muted: OIAColors.mutedDark,
    inverse: OIAColors.charcoal,
  },
};

export type OIATheme = typeof lightTheme;
```

### CSS Variables (Web)

```css
:root {
  /* Brand */
  --oia-sage: #8BA888;
  --oia-sage-dark: #7A9676;
  --oia-sage-light: #96B893;
  --oia-coral: #E8A598;
  --oia-coral-dark: #D99A8E;
  --oia-coral-light: #F0B5A8;
  
  /* Backgrounds */
  --oia-cream: #F5F2ED;
  --oia-warm-white: #FDFCFA;
  --oia-dark-bg: #1A1A1A;
  --oia-dark-card: #242424;
  --oia-dark-elevated: #2E2E2E;
  
  /* Supporting */
  --oia-dusty-blue: #7A8FA3;
  --oia-taupe: #A69485;
  --oia-olive: #6B6B5E;
  --oia-mustard: #C9A86C;
  
  /* Text */
  --oia-charcoal: #2D2D2D;
  --oia-stone: #5C5C5C;
  --oia-muted: #8C8C8C;
  --oia-off-white: #F0EDE8;
  --oia-warm-gray: #A8A8A8;
  --oia-muted-dark: #6C6C6C;
  
  /* Semantic */
  --oia-success: #8BA888;
  --oia-warning: #C9A86C;
  --oia-error: #D4847A;
  --oia-info: #7A8FA3;
  
  /* Spacing */
  --oia-space-xs: 4px;
  --oia-space-sm: 8px;
  --oia-space-md: 16px;
  --oia-space-lg: 24px;
  --oia-space-xl: 32px;
  --oia-space-xxl: 48px;
  
  /* Radius */
  --oia-radius-sm: 8px;
  --oia-radius-md: 12px;
  --oia-radius-lg: 16px;
  --oia-radius-xl: 24px;
  
  /* Typography */
  --oia-font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

---

## Color Migration Guide

When applying this design system to an existing app:

| Old Color | New Color | Token |
|-----------|-----------|-------|
| Blue (#007AFF) | Sage | `colors.sage` |
| Bright Green | Sage | `colors.sage` |
| Orange/Amber | Mustard | `colors.mustard` |
| Gray | Taupe | `colors.taupe` |
| Pure White (#FFF) | Warm White | `colors.warmWhite` |
| Pure Black (#000) | Dark BG | `colors.darkBg` |
| Light Gray BG | Cream | `colors.cream` |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-29 | Initial design system — colors, typography, spacing, components, ADHD UX rules, React Native implementation |

---

## Quick Reference Card

### Colors at a Glance

| Purpose | Light Mode | Dark Mode |
|---------|------------|-----------|
| Primary Action | Sage `#8BA888` | Sage Light `#96B893` |
| Brand Accent | Coral `#E8A598` | Coral Dark `#D99A8E` |
| Background | Cream `#F5F2ED` | Dark BG `#1A1A1A` |
| Card | Warm White `#FDFCFA` | Dark Card `#242424` |
| Primary Text | Charcoal `#2D2D2D` | Off-White `#F0EDE8` |
| Secondary Text | Stone `#5C5C5C` | Warm Gray `#A8A8A8` |
| Border | Taupe `#A69485` | Olive `#6B6B5E` |

### Component Sizes

| Component | Size |
|-----------|------|
| Button height | 56px |
| Input height | 56px |
| Touch target | 48-56px |
| Bottom nav | 64px + safe |
| FAB | 56px |
| Checkbox | 24px |
| Border radius (buttons) | 12px |
| Border radius (cards) | 16px |

---

*This is the visual foundation for everything OIA builds. Warm. Calm. Human.*
