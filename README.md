# Text Breath

Each line of a paragraph oscillates its letter-spacing — or variable font axis — at a phase offset from its neighbours. Two modes: `phase` gives each line a fixed ripple at a staggered point in the cycle; `tide` sends a traveling wave through the paragraph from top to bottom. At low amplitudes it reads as living rather than animated.

**[textbreath.com](https://textbreath.com)** · [npm](https://www.npmjs.com/package/@liiift-studio/textbreath) · [GitHub](https://github.com/Liiift-Studio/TextBreath)

TypeScript · Zero dependencies · React + Vanilla JS

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

<BreatheText amplitude={0.012} period={3.5} phaseOffset={0.785}>
  Your paragraph text here...
</BreatheText>
```

### React hook

```tsx
import { useBreathe } from '@liiift-studio/textbreath'

const ref = useBreathe({ amplitude: 0.012, period: 3.5, phaseOffset: 0.785 })
<p ref={ref}>{children}</p>
```

### Vanilla JS

`applyBreathe` wraps lines and returns them. `startBreathe` drives the animation loop and returns a stop function.

```ts
import { applyBreathe, startBreathe, removeBreathe, getCleanHTML } from '@liiift-studio/textbreath'

const el = document.querySelector('p')
const original = getCleanHTML(el)
const opts = { amplitude: 0.012, period: 3.5 }

const { lineSpans } = applyBreathe(el, original, opts)
const stop = startBreathe(lineSpans, opts)

// Later — stop the animation loop and restore the DOM:
stop()
removeBreathe(el, original)
```

---

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `amplitude` | `0.012` | Peak change per cycle. Em units for `letter-spacing`. For `wdth`, the axis value becomes `100 ± (amplitude × 100)`. For `wght`, it becomes `400 ± (amplitude × 400)` |
| `period` | `3.5` | Seconds per full oscillation cycle |
| `phaseOffset` | `π/4` ≈ `0.785` | Radians of phase shift between adjacent lines. Used in `'phase'` mode only |
| `waveShape` | `'sine'` | `'sine'` \| `'triangle'` |
| `axis` | `'letter-spacing'` | CSS property or variable font axis to animate: `'letter-spacing'` \| `'wdth'` \| `'wght'` |
| `mode` | `'phase'` | `'phase'` — standing ripple, each line at a fixed phase offset. `'tide'` — wave travels through the paragraph |
| `direction` | `'down'` | Tide travel direction: `'down'` \| `'up'`. Used in `'tide'` mode only |
| `lineDetection` | `'bcr'` | `'bcr'` reads actual browser layout — ground truth, works with any font and inline HTML. `'canvas'` uses [`@chenglou/pretext`](https://github.com/chenglou/pretext) for arithmetic line breaking with no forced reflow on resize. Install pretext separately |
| `as` | `'p'` | HTML element to render. *(React component only)* |

---

## How it works

Each visual line is wrapped in a `<span>`. In `phase` mode, line `i` is assigned a fixed phase of `i × phaseOffset` radians, and the wave is evaluated at that phase each frame. In `tide` mode, each line's phase advances with both time and its index — the same traveling wave used by Flood Text, but applied to letter-spacing or a variable font axis rather than per-character. Both modes run a `requestAnimationFrame` loop at consistent speed regardless of display refresh rate. The loop cleans up on unmount.

---

## Dev notes

### `next` in root devDependencies

`package.json` at the repo root lists `next` as a devDependency. This is a **Vercel detection workaround** — not a real dependency of the npm package. Vercel's build system inspects the root `package.json` to detect the framework; without `next` present it falls back to a static build and skips the Next.js pipeline, breaking the `/site` subdirectory deploy.

The package itself has zero runtime dependencies. Do not remove this entry.

---

## Future improvements

- **Additional wave shapes** — `sawtooth` for a sharp-edged, one-directional sweep per line
- **Multi-axis mode** — animate both `letter-spacing` and a variable font axis simultaneously from a single instance
- **Scroll-phase mode** — tie the wave phase to scroll position rather than time, so the paragraph breathes as the user reads down the page
- **Amplitude envelope** — fade amplitude in on mount and out on unmount for a softer entrance and exit
- **`prefers-reduced-motion` fade** — currently the animation is disabled entirely under reduced-motion; instead fade to a static state over several seconds

---

Current version: v1.0.0
