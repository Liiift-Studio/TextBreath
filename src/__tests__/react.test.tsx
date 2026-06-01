// textBreath/src/__tests__/react.test.tsx — @testing-library/react hook and component tests
import React from 'react'
import { render, renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useBreathe } from '../react/useBreathe'
import { BreatheText } from '../react/BreatheText'
import { BREATHE_CLASSES } from '../core/types'

// ─── DOM measurement mock (mirrors adjust.test.ts pattern) ────────────────────
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
		get: function (this: HTMLElement) {
			if (this.classList?.contains(BREATHE_CLASSES.probe)) return 0
			if (this.classList?.contains(BREATHE_CLASSES.word)) return WORD_WIDTH
			return CONTAINER_WIDTH
		},
	})
	const origBCR = Element.prototype.getBoundingClientRect
	Element.prototype.getBoundingClientRect = function (this: Element) {
		const el = this as HTMLElement
		if (el.classList?.contains(BREATHE_CLASSES.probe))
			return { width: 0, top: 0, left: 0, bottom: 20, right: 0, height: 20, x: 0, y: 0, toJSON: () => ({}) }
		if (el.classList?.contains(BREATHE_CLASSES.word)) {
			const lineIndex = Math.floor(wordCallIndex / 7)
			wordCallIndex++
			const top = lineIndex * 20
			return { width: WORD_WIDTH, top, left: 0, bottom: top + 20, right: WORD_WIDTH, height: 20, x: 0, y: top, toJSON: () => ({}) }
		}
		return { width: CONTAINER_WIDTH, top: 0, left: 0, bottom: 20, right: CONTAINER_WIDTH, height: 20, x: 0, y: 0, toJSON: () => ({}) }
	}
	return () => {
		if (prior) Object.defineProperty(proto, 'offsetWidth', prior)
		Element.prototype.getBoundingClientRect = origBCR
	}
}

// ─── useBreathe ───────────────────────────────────────────────────────────────
describe('useBreathe', () => {
	let cleanupMock: (() => void) | null = null

	beforeEach(() => {
		document.body.innerHTML = ''
		cleanupMock = mockMeasurement()
	})

	afterEach(() => {
		cleanupMock?.()
		cleanupMock = null
	})

	it('mounts without throwing', () => {
		expect(() => {
			const { unmount } = renderHook(() => useBreathe({}))
			unmount()
		}).not.toThrow()
	})

	it('returns a ref object', () => {
		const { result, unmount } = renderHook(() => useBreathe({}))
		expect(result.current).toBeDefined()
		expect(typeof result.current).toBe('object')
		unmount()
	})

	it('unmounts without throwing', () => {
		const { unmount } = renderHook(() => useBreathe({ amplitude: 0.01, period: 3 }))
		expect(() => unmount()).not.toThrow()
	})

	it('re-runs when amplitude option changes', () => {
		const { rerender, unmount } = renderHook(
			({ amplitude }: { amplitude: number }) => useBreathe({ amplitude }),
			{ initialProps: { amplitude: 0.01 } },
		)
		expect(() => {
			act(() => {
				rerender({ amplitude: 0.05 })
			})
		}).not.toThrow()
		unmount()
	})

	it('re-runs when period option changes', () => {
		const { rerender, unmount } = renderHook(
			({ period }: { period: number }) => useBreathe({ period }),
			{ initialProps: { period: 2 } },
		)
		expect(() => {
			act(() => {
				rerender({ period: 5 })
			})
		}).not.toThrow()
		unmount()
	})

	it('re-runs when waveShape changes', () => {
		type WaveShape = 'sine' | 'triangle' | 'sawtooth'
		const { rerender, unmount } = renderHook(
			({ waveShape }: { waveShape: WaveShape }) => useBreathe({ waveShape }),
			{ initialProps: { waveShape: 'sine' as WaveShape } },
		)
		expect(() => {
			act(() => {
				rerender({ waveShape: 'triangle' })
			})
		}).not.toThrow()
		unmount()
	})

	it('re-runs when mode changes', () => {
		type Mode = 'phase' | 'tide'
		const { rerender, unmount } = renderHook(
			({ mode }: { mode: Mode }) => useBreathe({ mode }),
			{ initialProps: { mode: 'phase' as Mode } },
		)
		expect(() => {
			act(() => {
				rerender({ mode: 'tide' })
			})
		}).not.toThrow()
		unmount()
	})

	it('accepts direction option without throwing', () => {
		const { unmount } = renderHook(() => useBreathe({ mode: 'tide', direction: 'up' }))
		expect(() => unmount()).not.toThrow()
	})

	it('accepts cancelOffscreen option without throwing', () => {
		const { unmount } = renderHook(() => useBreathe({ cancelOffscreen: true }))
		expect(() => unmount()).not.toThrow()
	})
})

// ─── BreatheText ──────────────────────────────────────────────────────────────
describe('BreatheText', () => {
	let cleanupMock: (() => void) | null = null

	beforeEach(() => {
		document.body.innerHTML = ''
		cleanupMock = mockMeasurement()
	})

	afterEach(() => {
		cleanupMock?.()
		cleanupMock = null
	})

	it('renders children as text content', () => {
		const { container } = render(<BreatheText>Hello world</BreatheText>)
		expect(container.textContent).toContain('Hello')
		expect(container.textContent).toContain('world')
	})

	it('renders a p element by default', () => {
		const { container } = render(<BreatheText>Test text</BreatheText>)
		expect(container.querySelector('p')).not.toBeNull()
	})

	it('renders a custom element when as prop is provided', () => {
		const { container } = render(<BreatheText as="div">Test text</BreatheText>)
		expect(container.querySelector('div')).not.toBeNull()
		expect(container.querySelector('p')).toBeNull()
	})

	it('forwards className to the root element', () => {
		const { container } = render(
			<BreatheText className="my-class">Test</BreatheText>,
		)
		const el = container.querySelector('p')
		expect(el?.classList.contains('my-class')).toBe(true)
	})

	it('renders with a wrapping p element that contains the text', () => {
		const { container } = render(<BreatheText>breathing paragraph</BreatheText>)
		const el = container.querySelector('p')
		expect(el).not.toBeNull()
		expect(container.textContent).toContain('breathing paragraph')
	})

	it('forwards style prop to the root element', () => {
		const { container } = render(
			<BreatheText style={{ color: 'red' }}>Test</BreatheText>,
		)
		const el = container.querySelector('p') as HTMLElement
		expect(el?.style.color).toBe('red')
	})

	it('mounts and unmounts without throwing', () => {
		const { unmount } = render(<BreatheText>Text</BreatheText>)
		expect(() => unmount()).not.toThrow()
	})

	it('accepts BreatheOptions props without throwing', () => {
		expect(() => {
			const { unmount } = render(
				<BreatheText amplitude={0.02} period={4} waveShape="triangle" mode="tide" direction="down">
					Test paragraph with some content
				</BreatheText>,
			)
			unmount()
		}).not.toThrow()
	})

	it('forwards external ref to the root element', () => {
		const ref = React.createRef<HTMLElement>()
		render(<BreatheText ref={ref}>Test</BreatheText>)
		expect(ref.current).not.toBeNull()
		expect(ref.current?.tagName.toLowerCase()).toBe('p')
	})
})
