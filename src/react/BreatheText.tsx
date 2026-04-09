// breathe/src/react/BreatheText.tsx — React component wrapper
import React, { forwardRef, useCallback } from 'react'
import { useBreathe } from './useBreathe'
import type { BreatheOptions } from '../core/types'

interface BreatheTextProps extends BreatheOptions {
	children: React.ReactNode
	className?: string
	style?: React.CSSProperties
	as?: React.ElementType
}

/**
 * Drop-in component that applies the breathe effect to its children.
 * Forwards the ref to the root DOM element while also wiring the internal breathe ref.
 */
export const BreatheText = forwardRef<HTMLElement, BreatheTextProps>(
	function BreatheText({ children, className, style, as: Tag = 'p', ...options }, ref) {
		const innerRef = useBreathe(options)

		/** Merge the internal breathe ref with the forwarded external ref */
		const mergedRef = useCallback(
			(node: HTMLElement | null) => {
				;(innerRef as React.MutableRefObject<HTMLElement | null>).current = node
				if (typeof ref === 'function') {
					ref(node)
				} else if (ref) {
					ref.current = node
				}
			},
			// innerRef is stable (useRef), ref identity is stable per render
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[ref],
		)

		return (
			<Tag ref={mergedRef} className={className} style={style}>
				{children}
			</Tag>
		)
	},
)

BreatheText.displayName = 'BreatheText'
