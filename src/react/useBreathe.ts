// breathe/src/react/useBreathe.ts — React hook
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { applyBreathe, getCleanHTML, startBreathe } from '../core/adjust'
import type { BreatheOptions } from '../core/types'

/**
 * React hook that applies the breathe effect to a ref'd element.
 * Re-detects lines and restarts animation on element width change.
 * Respects prefers-reduced-motion — no animation when the user has opted out.
 */
export function useBreathe(options: BreatheOptions) {
	const ref = useRef<HTMLElement>(null)
	const originalHTMLRef = useRef<string | null>(null)
	const stopRef = useRef<(() => void) | null>(null)
	const optionsRef = useRef(options)
	optionsRef.current = options

	const { amplitude, period, phaseOffset, waveShape, axis, mode, direction, lineDetection } = options

	/** Stop any running animation, re-detect lines, and restart. */
	const run = useCallback(() => {
		const el = ref.current
		if (!el) return

		if (originalHTMLRef.current === null) {
			originalHTMLRef.current = getCleanHTML(el)
		}

		stopRef.current?.()
		stopRef.current = null

		const { lineSpans } = applyBreathe(el, originalHTMLRef.current, optionsRef.current)

		const prefersReducedMotion =
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches

		if (!prefersReducedMotion && lineSpans.length > 0) {
			stopRef.current = startBreathe(lineSpans, optionsRef.current)
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [amplitude, period, phaseOffset, waveShape, axis, mode, direction, lineDetection])

	useLayoutEffect(() => {
		run()

		const el = ref.current
		if (!el) return

		let lastWidth = 0
		let rafId = 0
		const ro = new ResizeObserver((entries) => {
			const w = Math.round(entries[0].contentRect.width)
			if (w === lastWidth) return
			lastWidth = w
			cancelAnimationFrame(rafId)
			rafId = requestAnimationFrame(run)
		})

		ro.observe(el)

		return () => {
			stopRef.current?.()
			stopRef.current = null
			ro.disconnect()
			cancelAnimationFrame(rafId)
		}
	}, [run])

	// Rerun after all fonts finish loading — line detection uses BCR which
	// gives wrong line groups if the font has not yet swapped in.
	useEffect(() => {
		document.fonts.ready.then(run)
	}, [run])

	return ref
}
