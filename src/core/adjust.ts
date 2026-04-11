// breathe/src/core/adjust.ts — framework-agnostic algorithm
import { BREATHE_CLASSES, type BreatheOptions } from './types'

// ─── Pretext (canvas line detection) ─────────────────────────────────────────

type PretextModule = {
	prepareWithSegments: (text: string, font: string) => unknown
	layoutWithLines: (prepared: unknown, maxWidth: number, lineHeight: number) => { lines: { text: string }[] }
}

let _pretext: PretextModule | null = null
let _pretextLoading = false

function tryLoadPretext(): void {
	if (_pretext !== null || _pretextLoading) return
	_pretextLoading = true
	import('@chenglou/pretext' as string)
		.then((m) => { _pretext = m as PretextModule })
		.catch(() => {
			console.warn('[textbreath] canvas lineDetection requires @chenglou/pretext — falling back to BCR')
		})
}

type PreparedEntry = { originalHTML: string; prepared: unknown }
const pretextCache = new WeakMap<HTMLElement, PreparedEntry>()

function getCanvasFont(el: HTMLElement): string {
	const s = getComputedStyle(el)
	const family = s.fontFamily.split(',')[0].replace(/['"]/g, '').trim()
	return `${s.fontWeight} ${s.fontSize} ${family}`
}

function getLineHeightPx(el: HTMLElement): number {
	const s = getComputedStyle(el)
	const lh = parseFloat(s.lineHeight)
	return isNaN(lh) ? parseFloat(s.fontSize) * 1.2 : lh
}

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
 * Strip any prior breathe markup from an element and return clean innerHTML.
 * Removes pb-word, pb-line, and pb-probe spans, unwrapping their children in place.
 * Safe to call multiple times — idempotent.
 *
 * @param el - Element that may contain breathe markup
 */
export function getCleanHTML(el: HTMLElement): string {
	const clone = el.cloneNode(true) as HTMLElement
	const selector = `.${BREATHE_CLASSES.word}, .${BREATHE_CLASSES.line}, .${BREATHE_CLASSES.probe}`
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
 * Apply breathe DOM structure to an element.
 * Wraps words in pb-word spans, groups them into lines by BCR.top, wraps lines
 * in pb-line spans, and inserts forced <br> elements between lines.
 * Returns the array of line span elements so the caller can animate them.
 *
 * @param element      - Target live DOM element (must be rendered and visible)
 * @param originalHTML - Clean HTML snapshot (from getCleanHTML or stored externally)
 * @param options      - BreatheOptions (merged with defaults)
 */
export function applyBreathe(
	element: HTMLElement,
	originalHTML: string,
	options: BreatheOptions = {},
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
			span.className = BREATHE_CLASSES.word
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

	// --- Pass 3: Group words into lines ---
	// Canvas path: pretext arithmetic (no forced reflow on resize).
	// BCR path: getBoundingClientRect — ground truth for actual browser layout.

	const lineDetection = options.lineDetection ?? 'bcr'
	if (lineDetection === 'canvas') tryLoadPretext()

	const useCanvas = lineDetection === 'canvas' && _pretext !== null

	const lineGroups: string[][] = [] // each group is an array of contextHTML strings

	if (useCanvas) {
		// Canvas path — use pretext to predict line breaks, no BCR reads
		const cached = pretextCache.get(element)
		let prepared: unknown
		if (cached && cached.originalHTML === originalHTML) {
			prepared = cached.prepared
		} else {
			prepared = _pretext!.prepareWithSegments(element.textContent ?? '', getCanvasFont(element))
			pretextCache.set(element, { originalHTML, prepared })
		}
		const { lines } = _pretext!.layoutWithLines(prepared, element.offsetWidth, getLineHeightPx(element))

		// Map pretext line texts to wordEntries by accumulated text matching
		let ei = 0
		for (let li = 0; li < lines.length && ei < wordEntries.length; li++) {
			const target = lines[li].text.replace(/\s+/g, ' ').trim()
			const group: string[] = []
			let acc = ''
			while (ei < wordEntries.length) {
				const word = (wordEntries[ei].span.textContent ?? '').replace(/\s+/g, ' ').trim()
				acc = acc ? acc + ' ' + word : word
				group.push(wordEntries[ei].contextHTML)
				ei++
				if (acc === target) break
			}
			if (group.length > 0) lineGroups.push(group)
		}
		// Trailing entries (normalisation difference) go to last group
		while (ei < wordEntries.length) {
			lineGroups[lineGroups.length - 1]?.push(wordEntries[ei++].contextHTML)
		}
	} else {
		// BCR path — batch all reads before any DOM writes
		type WordData = { contextHTML: string; top: number }
		const wordData: WordData[] = wordEntries.map(({ span, contextHTML }) => ({
			contextHTML,
			top: Math.round(span.getBoundingClientRect().top),
		}))

		let currentGroup: string[] = []
		let currentTop: number | null = null

		for (const { contextHTML, top } of wordData) {
			if (currentTop === null) currentTop = top
			if (top !== currentTop) {
				if (currentGroup.length > 0) lineGroups.push(currentGroup)
				currentGroup = []
				currentTop = top
			}
			currentGroup.push(contextHTML)
		}
		if (currentGroup.length > 0) lineGroups.push(currentGroup)
	}

	if (lineGroups.length === 0) return { lineSpans: [] }

	// --- Pass 4: Build HTML — wrap each line group in a pb-line span ---
	// Each line is an inline-block span containing the words with their inline context.
	// A <br data-pb-break> between lines forces visual line breaks.
	const parts: string[] = []

	lineGroups.forEach((group, groupIndex) => {
		const wordsHTML = group.join('')
		parts.push(
			`<span class="${BREATHE_CLASSES.line}" style="${LINE_STYLE}">${wordsHTML}</span>`,
		)
		if (groupIndex < lineGroups.length - 1) {
			parts.push('<br data-pb-break="1">')
		}
	})

	element.innerHTML = parts.join('')

	// Collect the rendered pb-line spans
	const lineSpans = Array.from(
		element.querySelectorAll<HTMLElement>(`.${BREATHE_CLASSES.line}`),
	)

	// Optional: clamp each line to its natural (pre-animation) width.
	// Batch read then batch write — no interleaving to avoid layout thrashing.
	const linePreservation = options.linePreservation ?? 'none'
	if (linePreservation === 'clamp') {
		const naturalWidths = lineSpans.map(span => span.getBoundingClientRect().width)
		lineSpans.forEach((span, i) => {
			span.style.maxWidth = `${naturalWidths[i]}px`
			span.style.overflowX = 'hidden'
		})
	}

	return { lineSpans }
}

/**
 * Start the breathe animation on a set of line spans.
 * Returns a cleanup function that cancels the rAF loop.
 *
 * @param lineSpans - Array of pb-line span elements from applyBreathe
 * @param options   - BreatheOptions (merged with defaults)
 */
export function startBreathe(
	lineSpans: HTMLElement[],
	options: BreatheOptions = {},
): () => void {
	if (lineSpans.length === 0) return () => {}

	// Skip animation on e-ink / slow-update displays — oscillation produces no
	// visible effect and wastes power. matchMedia('(update: slow)') is true on
	// Kindle, Remarkable, and other e-ink panels.
	if (typeof window !== 'undefined' && window.matchMedia('(update: slow)').matches) return () => {}

	const amplitude   = options.amplitude   ?? DEFAULTS.amplitude
	const period      = options.period      ?? DEFAULTS.period
	const phaseOffset = options.phaseOffset ?? DEFAULTS.phaseOffset
	const waveShape   = options.waveShape   ?? DEFAULTS.waveShape
	const axis        = options.axis        ?? DEFAULTS.axis
	const mode        = options.mode        ?? 'phase'
	const direction   = options.direction   ?? 'down'

	const n      = lineSpans.length
	const speed  = 1 / period // cycles per second (used in tide mode)
	// elapsed tracks visible animation time only. Without this, performance.now() jumps
	// when a hidden tab becomes visible again, causing a phase teleport in the wave.
	let elapsed  = 0
	let lastTick = performance.now()
	let rafId    = 0

	function tick() {
		const now = performance.now()
		if (!document.hidden) elapsed += (now - lastTick) / 1000
		lastTick = now
		const t = elapsed // seconds of visible animation time

		lineSpans.forEach((span, i) => {
			let wave: number

			if (mode === 'tide') {
				// Traveling wave: phase advances across lines over time
				const pos = n > 1 ? i / (n - 1) : 0
				const phase = direction === 'up'
					? pos - t * speed
					: pos + t * speed
				wave = waveShape === 'triangle'
					? triangleWave(phase)
					: Math.sin(2 * Math.PI * phase)
			} else {
				// Phase mode: each line has a fixed angular offset, oscillates in place
				const phase = i * phaseOffset
				wave = waveShape === 'triangle'
					? triangleWave(t / period + phase / (2 * Math.PI))
					: Math.sin(2 * Math.PI * t / period + phase)
			}

			const value = amplitude * wave

			if (axis === 'wdth') {
				span.style.fontVariationSettings = `'wdth' ${100 + value * 100}`
			} else if (axis === 'wght') {
				span.style.fontVariationSettings = `'wght' ${400 + value * 400}`
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
 * Remove breathe markup and restore the element to its original HTML.
 *
 * @param element      - Element that was previously adjusted
 * @param originalHTML - The snapshot passed to the original applyBreathe call
 */
export function removeBreathe(element: HTMLElement, originalHTML: string): void {
	element.innerHTML = originalHTML
}
