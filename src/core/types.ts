// breathe/src/core/types.ts — types and class constants

/** Options controlling the breathe animation */
export interface BreatheOptions {
	/** Peak letter-spacing change in em units (default: 0.012) */
	amplitude?: number
	/** Seconds per full oscillation cycle (default: 3.5) */
	period?: number
	/** Radians of phase shift between adjacent lines (default: Math.PI / 4) */
	phaseOffset?: number
	/** Wave shape used for oscillation (default: 'sine') */
	waveShape?: 'sine' | 'triangle'
	/** CSS property to animate (default: 'letter-spacing') */
	axis?: 'letter-spacing' | 'wdth'
}

/** CSS class names injected by breathe — use these to target generated markup */
export const BREATHE_CLASSES = {
	word: 'pb-word',
	line: 'pb-line',
	probe: 'pb-probe',
} as const
