// paragraph-breath/src/core/adjust.ts — framework-agnostic algorithm
import { PARAGRAPH_BREATH_CLASSES, type ParagraphBreathOptions } from './types'

/** Resolved defaults applied when options are omitted */
const DEFAULTS = {
	amplitude: 0.012,
	period: 3.5,
	phaseOffset: Math.PI / 4,
	waveShape: 'sine' as const,
	axis: 'letter-spacing' as const,
}

/** Inline-block style applied to each synthesised line span */
const LINE_STYLE = 'display:inline-block;white-space:nowrap;'

/**
 * Triangle wave oscillating between -1 and 1 over a period of 1.
 * Input t is a fractional position (any real number).
 *
 * @param t - Fractional time position (period = 1)
 */
export function triangleWave(t: number): number {
	const x = ((t % 1) + 1) % 1 // normalise to [0, 1)
	return x < 0.5 ? 4 * x - 1 : 3 - 4 * x
}

/**
 * Strip any prior paragraph-breath markup from an element and return clean innerHTML.
 * Removes pb-word, pb-line, and pb-probe spans, unwrapping their children in place.
 * Safe to call multiple times — idempotent.
 *
 * @param el - Element that may contain paragraph-breath markup
 */
export function getCleanHTML(el: HTMLElement): string {
	const clone = el.cloneNode(true) as HTMLElement
	const selector = `.${PARAGRAPH_BREATH_CLASSES.word}, .${PARAGRAPH_BREATH_CLASSES.line}, .${PARAGRAPH_BREATH_CLASSES.probe}`
	clone.querySelectorAll(selector).forEach((node) => {
		const parent = node.parentNode
		if (!parent) return
		while (node.firstChild) parent.insertBefore(node.firstChild, node)
		parent.removeChild(node)
	})
	// Remove any <br> elements that were inserted as line separators
	clone.querySelectorAll('br[data-pb-break]').forEach((br) => br.parentNode?.removeChild(br))
	return clone.innerHTML
}

/**
 * Apply paragraph-breath DOM structure to an element.
 * Wraps words in pb-word spans, groups them into lines by BCR.top, wraps lines
 * in pb-line spans, and inserts forced <br> elements between lines.
 * Returns the array of line span elements so the caller can animate them.
 *
 * @param element      - Target live DOM element (must be rendered and visible)
 * @param originalHTML - Clean HTML snapshot (from getCleanHTML or stored externally)
 * @param options      - ParagraphBreathOptions (merged with defaults)
 */
export function applyParagraphBreath(
	element: HTMLElement,
	originalHTML: string,
	options: ParagraphBreathOptions = {},
): { lineSpans: HTMLElement[] } {
	if (typeof window === 'undefined') return { lineSpans: [] }
	if (!element) return { lineSpans: [] }

	// --- Pass 1: Reset ---
	element.innerHTML = originalHTML

	// --- Pass 2: Walk text nodes and wrap each word in a pb-word span ---
	// Uses recursive childNodes traversal (not createTreeWalker) for reliable
	// descent into inline elements across all DOM implementations including happy-dom.
	const textNodes: Text[] = []
	;(function collectTextNodes(node: Node) {
		if (node.nodeType === Node.TEXT_NODE) {
			textNodes.push(node as Text)
		} else {
			node.childNodes.forEach(collectTextNodes)
		}
	})(element)

	// Track each word span alongside its contextual HTML (word wrapped in ancestor inline elements)
	type WordEntry = { span: HTMLElement; contextHTML: string }
	const wordEntries: WordEntry[] = []

	for (const textNode of textNodes) {
		const text = textNode.textContent ?? ''
		if (!text.trim()) continue

		// Split into alternating [whitespace, word, whitespace, word, …] tokens.
		// Even indices are whitespace gaps; odd indices are words.
		const tokens = text.split(/(\S+)/)
		const fragment = document.createDocumentFragment()

		for (let i = 0; i < tokens.length; i += 2) {
			const space = tokens[i]      // whitespace before this word
			const word  = tokens[i + 1] // word (undefined at end of string)
			if (!word) continue

			const isLastWord = tokens[i + 3] === undefined
			const trailingSpace = isLastWord ? (tokens[i + 2] ?? '') : ''

			const span = document.createElement('span')
			span.className = PARAGRAPH_BREATH_CLASSES.word
			span.textContent = space + word + trailingSpace
			fragment.appendChild(span)

			// Build contextual HTML: word span wrapped in ancestor inline elements
			// up to the block element. This preserves <em>, <strong>, <a>, etc.
			let html = span.outerHTML
			let ancestor: Element | null = textNode.parentElement
			while (ancestor && ancestor !== element) {
				const shallow = ancestor.cloneNode(false) as Element
				const shallowHTML = shallow.outerHTML
				const split = shallowHTML.lastIndexOf('</')
				html = shallowHTML.slice(0, split) + html + shallowHTML.slice(split)
				ancestor = ancestor.parentElement
			}

			wordEntries.push({ span, contextHTML: html })
		}

		textNode.parentNode!.replaceChild(fragment, textNode)
	}

	if (wordEntries.length === 0) return { lineSpans: [] }

	// --- Pass 3: Read BCR.top for each word span and group into lines ---
	// Batch all BCR reads before any DOM writes.
	type WordData = { contextHTML: string; top: number }
	const wordData: WordData[] = wordEntries.map(({ span, contextHTML }) => ({
		contextHTML,
		top: Math.round(span.getBoundingClientRect().top),
	}))

	// Group by vertical position
	const lineGroups: string[][] = [] // each group is an array of contextHTML strings
	let currentGroup: string[] = []
	let currentTop: number | null = null

	for (const { contextHTML, top } of wordData) {
		if (currentTop === null) {
			currentTop = top
		}
		if (top !== currentTop) {
			if (currentGroup.length > 0) lineGroups.push(currentGroup)
			currentGroup = []
			currentTop = top
		}
		currentGroup.push(contextHTML)
	}
	if (currentGroup.length > 0) lineGroups.push(currentGroup)

	if (lineGroups.length === 0) return { lineSpans: [] }

	// --- Pass 4: Build HTML — wrap each line group in a pb-line span ---
	// Each line is an inline-block span containing the words with their inline context.
	// A <br data-pb-break> between lines forces visual line breaks.
	const parts: string[] = []

	lineGroups.forEach((group, groupIndex) => {
		const wordsHTML = group.join('')
		parts.push(
			`<span class="${PARAGRAPH_BREATH_CLASSES.line}" style="${LINE_STYLE}">${wordsHTML}</span>`,
		)
		if (groupIndex < lineGroups.length - 1) {
			parts.push('<br data-pb-break="1">')
		}
	})

	element.innerHTML = parts.join('')

	// Collect the rendered pb-line spans
	const lineSpans = Array.from(
		element.querySelectorAll<HTMLElement>(`.${PARAGRAPH_BREATH_CLASSES.line}`),
	)

	return { lineSpans }
}

/**
 * Start the breath animation on a set of line spans.
 * Returns a cleanup function that cancels the rAF loop.
 *
 * @param lineSpans - Array of pb-line span elements from applyParagraphBreath
 * @param options   - ParagraphBreathOptions (merged with defaults)
 */
export function startBreath(
	lineSpans: HTMLElement[],
	options: ParagraphBreathOptions = {},
): () => void {
	if (lineSpans.length === 0) return () => {}

	const amplitude   = options.amplitude   ?? DEFAULTS.amplitude
	const period      = options.period      ?? DEFAULTS.period
	const phaseOffset = options.phaseOffset ?? DEFAULTS.phaseOffset
	const waveShape   = options.waveShape   ?? DEFAULTS.waveShape
	const axis        = options.axis        ?? DEFAULTS.axis

	const startTime = performance.now()
	let rafId = 0

	function tick() {
		const t = (performance.now() - startTime) / 1000 // seconds

		lineSpans.forEach((span, i) => {
			const phase = i * phaseOffset
			const wave = waveShape === 'triangle'
				? triangleWave(t / period + phase / (2 * Math.PI))
				: Math.sin(2 * Math.PI * t / period + phase)

			const value = amplitude * wave

			if (axis === 'wdth') {
				span.style.fontVariationSettings = `'wdth' ${100 + value * 100}`
			} else {
				span.style.letterSpacing = `${value}em`
			}
		})

		rafId = requestAnimationFrame(tick)
	}

	rafId = requestAnimationFrame(tick)

	return () => cancelAnimationFrame(rafId)
}

/**
 * Remove paragraph-breath markup and restore the element to its original HTML.
 *
 * @param element      - Element that was previously adjusted
 * @param originalHTML - The snapshot passed to the original applyParagraphBreath call
 */
export function removeParagraphBreath(element: HTMLElement, originalHTML: string): void {
	element.innerHTML = originalHTML
}
