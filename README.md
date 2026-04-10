# Text Breath

Per-line letter-spacing oscillation at offset phases — the paragraph breathes. Each line is at a different point in the same sine wave, giving the text a slow, ambient motion that never calls attention to itself.

**[textbreath.com](https://textbreath.com)** · [npm](https://www.npmjs.com/package/@liiift-studio/textbreath) · [GitHub](https://github.com/Liiift-Studio/TextBreath)

---

## Install

```bash
npm install @liiift-studio/textbreath
```

---

## Usage

### React component

```tsx
import { BreatheText } from '@liiift-studio/textbreath'

<BreatheText amplitude={0.012} period={3.5} mode="phase">
  Your paragraph text here...
</BreatheText>
```

### React hook

```tsx
import { useBreathe } from '@liiift-studio/textbreath'

function Paragraph({ children }) {
  const ref = useBreathe({ amplitude: 0.012, period: 3.5 })
  return <p ref={ref}>{children}</p>
}
```

### Vanilla JS

```ts
import { startBreathe, removeBreathe, getCleanHTML } from '@liiift-studio/textbreath'

const el = document.querySelector('p')
const originalHTML = getCleanHTML(el)

// Returns a cleanup function — call it to stop the animation
const stop = startBreathe(el, originalHTML, { amplitude: 0.012, period: 3.5 })
```

---

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `lineDetection` | `'bcr' \| 'canvas'` | `'bcr'` | Line detection method — `'bcr'` reads browser layout; `'canvas'` uses `@chenglou/pretext` for zero-reflow resize |
| `amplitude` | `number` | `0.012` | Peak letter-spacing change in em units (or axis units for `wdth`/`wght`) |
| `period` | `number` | `3.5` | Seconds per full oscillation cycle |
| `phaseOffset` | `number` | `Math.PI / 4` | Radians of phase shift between adjacent lines (used in `'phase'` mode) |
| `waveShape` | `'sine' \| 'triangle'` | `'sine'` | Wave shape |
| `axis` | `'letter-spacing' \| 'wdth' \| 'wght'` | `'letter-spacing'` | CSS property or variable font axis to animate |
| `mode` | `'phase' \| 'tide'` | `'phase'` | `'phase'` gives each line a fixed offset; `'tide'` sends a traveling wave down the paragraph |
| `direction` | `'up' \| 'down'` | `'down'` | Wave travel direction — only used when `mode` is `'tide'` |

---

## Dev notes

### `next` in root devDependencies

`package.json` at the repo root lists `next` as a devDependency. This is a **Vercel detection workaround** — not a real dependency of the npm package. Vercel's build system inspects the root `package.json` to detect the framework; without `next` present it falls back to a static build and skips the Next.js pipeline, breaking the `/site` subdirectory deploy.

The package itself has zero runtime dependencies. Do not remove this entry.

---

Current version: v1.0.0
