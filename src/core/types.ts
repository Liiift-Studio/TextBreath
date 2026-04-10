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
	/**
	 * Animation mode — 'phase' gives each line a fixed offset; 'tide' sends a traveling wave through the paragraph.
	 * @default 'phase'
	 */
	mode?: 'phase' | 'tide'
	/**
	 * Wave travel direction — only used when mode is 'tide'.
	 * @default 'down'
	 */
	direction?: 'up' | 'down'
	/**
	 * Line width preservation strategy during animation. Default: 'none'
	 *
	 * Letter-spacing and axis animation change each line's visual width with the wave.
	 * At the default amplitude (0.012em) the peak overflow per 60-character line is
	 * roughly 11px — imperceptible for most uses. For display text or large amplitudes
	 * the breathing width change may be noticeable or cause container overflow.
	 *
	 * - **'none'** (default) — no constraint; lines expand and contract freely with the wave.
	 *
	 * - **'clamp'** — each line is constrained to its natural (pre-animation) width via
	 *   `max-width` and `overflow: hidden`. The breathing effect is contained within each
	 *   line box. Characters at the trailing edge clip slightly during the wide phase.
	 *   Prevents any container overflow regardless of amplitude.
	 */
	linePreservation?: 'none' | 'clamp'
}

/** CSS class names injected by breathe — use these to target generated markup */
export const BREATHE_CLASSES = {
	word: 'pb-word',
	line: 'pb-line',
	probe: 'pb-probe',
} as const
