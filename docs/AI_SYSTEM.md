# AI System

## Runtime Provider

Gemini API.

## Responsibilities

Gemini may handle:

- strategy recommendation
- content pillar selection
- content ideation
- headline/copy/caption/CTA/hashtags
- creative direction
- image generation/editing
- post self-review
- future performance-based recommendations

## Required Context Per Generation

- brand guidelines
- current content strategy
- recent post history
- recent content pillar distribution
- available assets
- product facts / forbidden claims
- optional UI screenshots
- requested language
- post objective if manually provided

## Anti-Repetition Rule

Before creating a post, compare against recent content. Avoid repeating:

- same pillar too frequently
- same headline structure
- same layout logic
- same visual focal point
- same UI mockup composition

## UI Asset Rule

If a real product UI screenshot is provided and the concept requires product UI, preserve the screenshot faithfully. Do not invent controls or recreate it from memory.

## Structured Output Proposal

Prefer JSON schema output for planning/copy. Image generation prompt can be derived from that structured result.
