---
name: project-brief
description: Core identity, scope, and constraints for paragraph-breath
type: project
---

# paragraph-breath — Project Brief

## Identity
- **Package name**: `paragraph-breath`
- **Version**: 0.0.1 (pre-release)
- **Author**: Quinn Keaveney / Liiift Studio

## What It Is
Each line of a paragraph has its letter-spacing oscillate slowly (±0.01em over 3–4s) at a slightly different phase offset, creating a slow ripple. Lines don't all move together — each is independently offset. At any moment the paragraph is inhaling at top and exhaling at bottom, or vice versa. Subtle. Living.

## What It Is Not
- Not a general animation library
- Not a CSS preprocessor
- Not a font loading utility

## API Surface (target)
Options: amplitude, period, phaseOffset, waveShape, axis

## Constraints
- Framework-agnostic core (vanilla JS)
- Optional React bindings (peer deps)
- SSR safe (guard typeof window)
- Zero required dependencies (opentype.js optional)
- TypeScript strict mode

## Status
Bootstrap complete. Algorithm not yet implemented.
See PROCESS.md for the build guide.
