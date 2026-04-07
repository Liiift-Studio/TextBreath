// paragraph-breath/src/core/types.ts — types and class constants
export interface ParagraphBreathOptions {
	// amplitude (em, default 0.01)
	// period (seconds per cycle, default 3.5)
	// phaseOffset (radians between lines, default π/4)
	// waveShape ('sine' | 'triangle')
	// axis ('letter-spacing' | 'wdth')
}

/** CSS class names injected by paragraph-breath — use these to target generated markup */
export const PARAGRAPH_BREATH_CLASSES = {
	word: 'paragraph-breath-word',
	line: 'paragraph-breath-line',
	probe: 'paragraph-breath-probe',
} as const
