// breathe/src/core/types.ts — types and class constants

/** Options controlling the breathe animation */
export interface BreatheOptions {
	/**
	 * Line detection method. Default: 'bcr'
	 *
	 * - **'bcr'** (default) — uses `getBoundingClientRect()` on injected word spans.
	 *   Ground truth: reads actual browser layout, handles all inline HTML and any font.
	 *
	 * - **'canvas'** — uses `@chenglou/pretext` canvas measurement for arithmetic line
	 *   breaking. No forced reflow on resize. Requires `@chenglou/pretext` to be installed.
	 *   Falls back to 'bcr' on the first render while pretext loads.
	 *   Avoid with `system-ui` font (canvas resolves differently on macOS).
	 */
	lineDetection?: 'bcr' | 'canvas'
	/** Peak letter-spacing change in em units (or axis units for wdth/wght) (default: 0.012) */
	amplitude?: number
	/** Seconds per full oscillation cycle (default: 3.5) */
	period?: number
	/** Radians of phase shift between adjacent lines — used in 'phase' mode (default: Math.PI / 4) */
	phaseOffset?: number
	/** Wave shape used for oscillation (default: 'sine') */
	waveShape?: 'sine' | 'triangle'
	/** CSS property / axis to animate (default: 'letter-spacing') */
	axis?: 'letter-spacing' | 'wdth' | 'wght'
	/** Animation mode — 'phase' gives each line a fixed offset; 'tide' sends a traveling wave through the paragraph (default: 'phase') */
	mode?: 'phase' | 'tide'
	/** Wave travel direction — only used when mode is 'tide' (default: 'down') */
	direction?: 'up' | 'down'
}

/** CSS class names injected by breathe — use these to target generated markup */
export const BREATHE_CLASSES = {
	word: 'pb-word',
	line: 'pb-line',
	probe: 'pb-probe',
} as const
