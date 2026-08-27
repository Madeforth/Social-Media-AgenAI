# Design System

## Design Goal

A premium AI creative workstation that feels closer to Linear + modern creator tools than to a generic admin dashboard.

Primary reference: `assets/reference/ui-concept.png`

## Core Visual Language

- Background: near-black / deep navy
- Panels: slightly lifted dark surfaces
- Borders: thin, low-contrast cool gray
- Primary accent: electric cyan / teal
- Secondary accent: restrained orange
- Success: green used sparingly
- Purple may be used for analytics or AI metadata accents
- Avoid rainbow gradients as a default style

## Typography

- Clean modern sans-serif for UI
- Condensed/editorial type may be used inside generated creative previews, not the app UI by default
- Strong hierarchy: large title, muted support text, compact labels

## Spacing

- 8pt base rhythm
- generous 24–32px card padding on desktop
- 16–20px on mobile
- maintain visible breathing room around generated creative

## Components

### Buttons

Primary: filled cyan/teal
Secondary: dark surface with border
Destructive: explicit red only when necessary

### Cards

Rounded, dark, thin border, minimal shadow. Hover should lift subtly.

### Status Chips

- Draft: neutral gray
- Generating: violet/animated
- Ready: cyan
- Revision: orange
- Approved: green
- Scheduled: amber
- Published: green/teal
- Failed: red

### Image Preview

The content preview is often the most important element on screen. Never bury it in a small thumbnail when review is the task.

## Web Layout

Desktop sidebar + content workspace.
Dashboard should feature:

- weekly planned count
- ready-to-approve count
- scheduled count
- published count
- create-with-AI hero panel
- upcoming posts
- approval queue
- performance snapshot

## Mobile Layout

Bottom navigation.
Home emphasizes:

- weekly progress
- ready for approval
- next scheduled content

Review flow:

- full-width image
- clear approve/revise/edit actions
- swipe between items if practical

## AI Create UX

Two modes:

1. AI Suggestion — strategy-led creation
2. Custom Brief — user-directed creation

The user should never be forced to write a long prompt.

## Motion

Subtle only:

- generation progress
- card hover/focus
- realtime status updates
- success confirmation
  Avoid excessive ambient animation.
