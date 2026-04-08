// textBreath/src/__tests__/adjust.test.ts — core algorithm tests
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { applyBreathe, removeBreathe, startBreathe, getCleanHTML, triangleWave } from '../core/adjust'
import { BREATHE_CLASSES } from '../core/types'

// ─── DOM measurement mock ─────────────────────────────────────────────────────
const CONTAINER_WIDTH = 600
const WORD_WIDTH = 80
let wordCallIndex = 0

function mockMeasurement() {
	wordCallIndex = 0
	const proto = HTMLElement.prototype
	const prior = Object.getOwnPropertyDescriptor(proto, 'offsetWidth')
	Object.defineProperty(proto, 'offsetWidth', {
		configurable: true,
		set: () => {},
		get: function (this) {
			if (this.classList?.contains(BREATHE_CLASSES.probe)) return 0
			if (this.classList?.contains(BREATHE_CLASSES.word)) return WORD_WIDTH
			return CONTAINER_WIDTH
		},
	})
	const origBCR = Element.prototype.getBoundingClientRect
	Element.prototype.getBoundingClientRect = function (this) {
		const el = this
		if (el.classList?.contains(BREATHE_CLASSES.probe))
			return { width: 0, top: 0, left: 0, bottom: 20, right: 0, height: 20, x: 0, y: 0, toJSON: () => {} }
		if (el.classList?.contains(BREATHE_CLASSES.word)) {
			const lineIndex = Math.floor(wordCallIndex / 7)
			wordCallIndex++
			const top = lineIndex * 20
			return { width: WORD_WIDTH, top, left: 0, bottom: top + 20, right: WORD_WIDTH, height: 20, x: 0, y: top, toJSON: () => {} }
		}
		return { width: CONTAINER_WIDTH, top: 0, left: 0, bottom: 20, right: CONTAINER_WIDTH, height: 20, x: 0, y: 0, toJSON: () => {} }
	}
	return () => {
		if (prior) Object.defineProperty(proto, 'offsetWidth', prior)
		Element.prototype.getBoundingClientRect = origBCR
	}
}

function makeElement(html) {
	const el = document.createElement('p')
	el.innerHTML = html
	el.style.width = CONTAINER_WIDTH + 'px'
	document.body.appendChild(el)
	return el
}

function nWords(n, word = 'word') {
	return Array.from({ length: n }, () => word).join(' ')
}

// ─── triangleWave ─────────────────────────────────────────────────────────────
describe('triangleWave', () => {
	it('returns -1 at t=0', () => { expect(triangleWave(0)).toBeCloseTo(-1) })
	it('returns 1 at t=0.5', () => { expect(triangleWave(0.5)).toBeCloseTo(1) })
	it('returns -1 at t=1 (full period)', () => { expect(triangleWave(1)).toBeCloseTo(-1) })
	it('is always in range [-1, 1]', () => {
		for (let t = 0; t < 2; t += 0.07) {
			const v = triangleWave(t)
			expect(v).toBeGreaterThanOrEqual(-1)
			expect(v).toBeLessThanOrEqual(1)
		}
	})
})

// ─── applyBreathe / getCleanHTML / removeBreathe ──────────────────────────────
describe('textBreath', () => {
	let cleanup = null
	beforeEach(() => { document.body.innerHTML = ''; cleanup = mockMeasurement() })
	afterEach(() => { cleanup?.(); cleanup = null })

	it('getCleanHTML is idempotent', () => {
		const el = makeElement('<em>Hello</em> world')
		expect(getCleanHTML(el)).toBe(getCleanHTML(el))
	})
	it('applyBreathe does not throw on empty element', () => {
		const el = makeElement('')
		expect(() => applyBreathe(el, getCleanHTML(el), {})).not.toThrow()
	})
	it('removeBreathe restores original HTML', () => {
		const el = makeElement('<em>Hello</em> world')
		const original = getCleanHTML(el)
		applyBreathe(el, original, {})
		removeBreathe(el, original)
		expect(el.innerHTML).toBe(original)
	})
	it('preserves inline elements after apply', () => {
		const el = makeElement('<em>italic</em> and <strong>bold</strong>')
		const original = getCleanHTML(el)
		applyBreathe(el, original, {})
		expect(el.querySelector('em')).toBeTruthy()
		expect(el.querySelector('strong')).toBeTruthy()
	})
	it('getCleanHTML strips breathe markup after apply', () => {
		const el = makeElement(nWords(14))
		const original = getCleanHTML(el)
		applyBreathe(el, original, {})
		const cleaned = getCleanHTML(el)
		expect(cleaned).not.toContain(BREATHE_CLASSES.line)
		expect(cleaned).not.toContain(BREATHE_CLASSES.word)
	})
	it('creates line spans for multi-line content', () => {
		const el = makeElement(nWords(14))
		const original = getCleanHTML(el)
		const { lineSpans } = applyBreathe(el, original, {})
		expect(lineSpans.length).toBeGreaterThanOrEqual(2)
	})
	it('returned lineSpans matches DOM line spans', () => {
		const el = makeElement(nWords(14))
		const original = getCleanHTML(el)
		const { lineSpans } = applyBreathe(el, original, {})
		const domSpans = el.querySelectorAll('.' + BREATHE_CLASSES.line)
		expect(lineSpans.length).toBe(domSpans.length)
	})
	it('apply is idempotent — applying twice does not double line spans', () => {
		const el = makeElement(nWords(14))
		const original = getCleanHTML(el)
		applyBreathe(el, original, {})
		const after1 = el.querySelectorAll('.' + BREATHE_CLASSES.line).length
		wordCallIndex = 0
		applyBreathe(el, original, {})
		expect(el.querySelectorAll('.' + BREATHE_CLASSES.line).length).toBe(after1)
	})
	it('single-word input does not crash and returns one line', () => {
		const el = makeElement('Hello')
		const original = getCleanHTML(el)
		const { lineSpans } = applyBreathe(el, original, {})
		expect(lineSpans.length).toBe(1)
	})
})

// ─── startBreathe ─────────────────────────────────────────────────────────────
describe('startBreathe', () => {
	let cleanup = null
	beforeEach(() => { document.body.innerHTML = ''; cleanup = mockMeasurement() })
	afterEach(() => { cleanup?.(); cleanup = null })

	it('returns a cleanup function', () => {
		const el = makeElement(nWords(14))
		const original = getCleanHTML(el)
		const { lineSpans } = applyBreathe(el, original, {})
		const stop = startBreathe(lineSpans, {})
		expect(typeof stop).toBe('function')
		stop()
	})
	it('no-op cleanup when given empty lineSpans', () => {
		const stop = startBreathe([], {})
		expect(() => stop()).not.toThrow()
	})
})
