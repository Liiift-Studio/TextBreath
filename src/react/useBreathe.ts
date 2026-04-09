// breathe/src/react/useBreathe.ts — React hook
import { useLayoutEffect, useRef } from 'react'
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

	const { amplitude, period, phaseOffset, waveShape, axis, mode, direction, lineDetection } = options

	useLayoutEffect(() => {
		const el = ref.current
		if (!el) return

		// Capture original HTML once (before any mutation)
		if (originalHTMLRef.current === null) {
			originalHTMLRef.current = getCleanHTML(el)
		}

		// Stop any running animation before re-applying
		stopRef.current?.()
		stopRef.current = null

		const { lineSpans } = applyBreathe(el, originalHTMLRef.current, options)

		// Respect the user's reduced-motion preference
		const prefersReducedMotion =
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches

		if (!prefersReducedMotion && lineSpans.length > 0) {
			stopRef.current = startBreathe(lineSpans, options)
		}

		// ResizeObserver: re-detect lines and restart animation on width change
		let lastWidth = 0
		let rafId = 0
		const ro = new ResizeObserver((entries) => {
			const w = Math.round(entries[0].contentRect.width)
			if (w === lastWidth) return
			lastWidth = w

			cancelAnimationFrame(rafId)
			rafId = requestAnimationFrame(() => {
				stopRef.current?.()
				stopRef.current = null

				if (!originalHTMLRef.current) return
				const { lineSpans: newSpans } = applyBreathe(
					el,
					originalHTMLRef.current,
					options,
				)

				const reduced =
					typeof window !== 'undefined' &&
					window.matchMedia('(prefers-reduced-motion: reduce)').matches

				if (!reduced && newSpans.length > 0) {
					stopRef.current = startBreathe(newSpans, options)
				}
			})
		})

		ro.observe(el)

		return () => {
			stopRef.current?.()
			stopRef.current = null
			ro.disconnect()
			cancelAnimationFrame(rafId)
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [amplitude, period, phaseOffset, waveShape, axis, mode, direction, lineDetection])

	return ref
}
