# paragraph-breath

> Continuous subtle per-line letter-spacing oscillation at offset phases — the paragraph breathes

## Concept

Each line of a paragraph has its letter-spacing oscillate slowly (±0.01em over 3–4s) at a slightly different phase offset, creating a slow ripple. Lines don't all move together — each is independently offset. At any moment the paragraph is inhaling at top and exhaling at bottom, or vice versa. Subtle. Living.

## Install

```bash
npm install paragraph-breath
```

## Usage

### React

```tsx
import { ParagraphBreathText } from 'paragraph-breath'

<ParagraphBreathText>
  Your paragraph text here.
</ParagraphBreathText>
```

### Vanilla JS

```ts
import { applyParagraphBreath, getCleanHTML } from 'paragraph-breath'

const el = document.querySelector('p')
const original = getCleanHTML(el)
applyParagraphBreath(el, original, { /* options */ })
```

## Options

| Option | Description |
|--------|-------------|
| `amplitude` | em, default 0.01 |
| `period` | seconds per cycle, default 3.5 |
| `phaseOffset` | radians between lines, default π/4 |
| `waveShape` | 'sine' | 'triangle' |
| `axis` | 'letter-spacing' | 'wdth' |

## Development

```bash
npm install
npm test
npm run build
```

---

Part of the [Liiift Studio](https://liiift.studio) typography tools family.
See also: [Ragtooth](https://ragtooth.liiift.studio)
