// paragraph-breath/__tests__/adjust.test.ts — unit tests for core algorithm
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
	applyParagraphBreath,
	startBreath,
	removeParagraphBreath,
	getCleanHTML,
	triangleWave,
} from '../src/core/adjust'
import { PARAGRAPH_BREATH_CLASSES } from '../src/core/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create and attach a div element so BCR reads work in happy-dom */
function makeElement(html: string): HTMLElement {
	const el = document.createElement('p')
	el.innerHTML = html
	document.body.appendChild(el)
	return el
}

function cleanup(el: HTMLElement) {
	el.parentNode?.removeChild(el)
}

// ---------------------------------------------------------------------------
// triangleWave
// ---------------------------------------------------------------------------

describe('triangleWave', () => {
	it('returns values in the range [-1, 1]', () => {
		const steps = 200
		for (let i = 0; i <= steps; i++) {
			const t = i / steps
			const v = triangleWave(t)
			expect(v).toBeGreaterThanOrEqual(-1 - 1e-9)
			expect(v).toBeLessThanOrEqual(1 + 1e-9)
		}
	})

	it('is -1 at t=0 and t=1', () => {
		expect(triangleWave(0)).toBeCloseTo(-1)
		expect(triangleWave(1)).toBeCloseTo(-1)
	})

	it('is 1 at t=0.5', () => {
		expect(triangleWave(0.5)).toBeCloseTo(1)
	})

	it('handles negative t via modulo wrap', () => {
		const v = triangleWave(-0.25)
		expect(v).toBeGreaterThanOrEqual(-1 - 1e-9)
		expect(v).toBeLessThanOrEqual(1 + 1e-9)
	})
})

// ---------------------------------------------------------------------------
// applyParagraphBreath — DOM structure
// ---------------------------------------------------------------------------

describe('applyParagraphBreath', () => {
	it('wraps lines in .pb-line spans', () => {
		const el = makeElement('Hello world foo bar')
		const html = el.innerHTML
		const { lineSpans } = applyParagraphBreath(el, html)
		const lines = el.querySelectorAll(`.${PARAGRAPH_BREATH_CLASSES.line}`)
		expect(lines.length).toBeGreaterThanOrEqual(1)
		cleanup(el)
	})

	it('returns lineSpans that match querySelectorAll result', () => {
		const el = makeElement('Hello world foo bar')
		const html = el.innerHTML
		const { lineSpans } = applyParagraphBreath(el, html)
		const domLines = el.querySelectorAll(`.${PARAGRAPH_BREATH_CLASSES.line}`)
		expect(lineSpans.length).toBe(domLines.length)
		cleanup(el)
	})

	it('does not throw on empty element', () => {
		const el = makeElement('')
		const html = el.innerHTML
		expect(() => applyParagraphBreath(el, html)).not.toThrow()
		cleanup(el)
	})

	it('preserves inline elements like <em> and <strong>', () => {
		const el = makeElement('Hello <em>world</em> and <strong>more</strong>')
		const html = el.innerHTML
		applyParagraphBreath(el, html)
		// After applying, em and strong descendants should still exist
		const em = el.querySelector('em')
		const strong = el.querySelector('strong')
		expect(em).not.toBeNull()
		expect(strong).not.toBeNull()
		cleanup(el)
	})

	it('pb-line spans have display:inline-block style', () => {
		const el = makeElement('Some text here')
		const html = el.innerHTML
		applyParagraphBreath(el, html)
		const line = el.querySelector<HTMLElement>(`.${PARAGRAPH_BREATH_CLASSES.line}`)
		expect(line?.style.display).toBe('inline-block')
		cleanup(el)
	})
})

// ---------------------------------------------------------------------------
// removeParagraphBreath
// ---------------------------------------------------------------------------

describe('removeParagraphBreath', () => {
	it('restores original HTML', () => {
		const el = makeElement('Hello world')
		const originalHTML = el.innerHTML
		applyParagraphBreath(el, originalHTML)
		// Confirm it mutated
		expect(el.innerHTML).not.toBe(originalHTML)
		removeParagraphBreath(el, originalHTML)
		expect(el.innerHTML).toBe(originalHTML)
		cleanup(el)
	})
})

// ---------------------------------------------------------------------------
// getCleanHTML — idempotency
// ---------------------------------------------------------------------------

describe('getCleanHTML', () => {
	it('is idempotent — calling twice returns the same result', () => {
		const el = makeElement('Hello <em>world</em>')
		const first = getCleanHTML(el)
		// Apply paragraph-breath and clean again
		applyParagraphBreath(el, first)
		const second = getCleanHTML(el)
		expect(second).toBe(first)
		cleanup(el)
	})

	it('removes pb-line, pb-word spans and unwraps children', () => {
		const el = makeElement('Hello world')
		const originalHTML = el.innerHTML
		applyParagraphBreath(el, originalHTML)
		const cleaned = getCleanHTML(el)
		expect(cleaned).not.toContain('pb-line')
		expect(cleaned).not.toContain('pb-word')
		cleanup(el)
	})
})

// ---------------------------------------------------------------------------
// startBreath — rAF loop
// ---------------------------------------------------------------------------

describe('startBreath', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		// Provide a stable performance.now mock
		vi.spyOn(performance, 'now').mockReturnValue(0)

		let rafCallbacks: FrameRequestCallback[] = []
		let nextId = 1

		vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
			const id = nextId++
			rafCallbacks.push(cb)
			return id
		})

		vi.stubGlobal('cancelAnimationFrame', (id: number) => {
			// Just clear the queue — simple stub
			rafCallbacks = []
		})

		// Allow flushing one rAF tick manually
		;(globalThis as unknown as Record<string, unknown>).__flushRaf = () => {
			const cbs = [...rafCallbacks]
			rafCallbacks = []
			cbs.forEach((cb) => cb(performance.now()))
		}
	})

	afterEach(() => {
		vi.useRealTimers()
		vi.restoreAllMocks()
		delete (globalThis as unknown as Record<string, unknown>).__flushRaf
	})

	it('returns a stop function', () => {
		const el = makeElement('Hello world')
		const html = el.innerHTML
		const { lineSpans } = applyParagraphBreath(el, html)

		// If no lineSpans in happy-dom (no layout), supply fake spans
		const spans = lineSpans.length > 0 ? lineSpans : [document.createElement('span')]
		const stop = startBreath(spans)
		expect(typeof stop).toBe('function')
		stop()
		cleanup(el)
	})

	it('stop function cancels the animation frame', () => {
		const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame')
		const span = document.createElement('span')
		const stop = startBreath([span])
		stop()
		expect(cancelSpy).toHaveBeenCalled()
		cancelSpy.mockRestore()
	})

	it('with phaseOffset: 0, all lines get the same letter-spacing', () => {
		const span1 = document.createElement('span')
		const span2 = document.createElement('span')
		const span3 = document.createElement('span')
		const spans = [span1, span2, span3]

		const stop = startBreath(spans, { phaseOffset: 0, amplitude: 0.05, period: 2 })

		// Flush one rAF tick
		;(globalThis as unknown as Record<string, unknown>).__flushRaf?.()

		const values = spans.map((s) => s.style.letterSpacing)
		// All three should be identical
		expect(values[0]).toBe(values[1])
		expect(values[1]).toBe(values[2])

		stop()
	})

	it('sets font-variation-settings when axis is wdth', () => {
		const span = document.createElement('span')
		const stop = startBreath([span], { axis: 'wdth', amplitude: 0.5, phaseOffset: 0 })

		;(globalThis as unknown as Record<string, unknown>).__flushRaf?.()

		expect(span.style.fontVariationSettings).toContain('wdth')
		stop()
	})
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
	it('startBreath returns a no-op function for empty lineSpans array', () => {
		const stop = startBreath([])
		expect(typeof stop).toBe('function')
		expect(() => stop()).not.toThrow()
	})

	it('applyParagraphBreath returns empty lineSpans for empty element', () => {
		const el = makeElement('')
		const { lineSpans } = applyParagraphBreath(el, '')
		expect(lineSpans).toHaveLength(0)
		cleanup(el)
	})
})
