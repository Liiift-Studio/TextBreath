// breathe/src/react/BreatheText.tsx — React component wrapper
import React, { forwardRef } from 'react'
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
 */
export const BreatheText = forwardRef<HTMLElement, BreatheTextProps>(
	function BreatheText({ children, className, style, as: Tag = 'p', ...options }, _ref) {
		const innerRef = useBreathe(options)
		return (
			<Tag ref={innerRef as React.Ref<HTMLElement>} className={className} style={style}>
				{children}
			</Tag>
		)
	},
)

BreatheText.displayName = 'BreatheText'
