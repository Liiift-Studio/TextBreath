// paragraph-breath/src/react/ParagraphBreathText.tsx — React component wrapper
import { forwardRef } from 'react'
import { useParagraphBreath } from './useParagraphBreath'
import type { ParagraphBreathOptions } from '../core/types'

interface ParagraphBreathTextProps extends ParagraphBreathOptions {
	children: React.ReactNode
	className?: string
	style?: React.CSSProperties
	as?: keyof JSX.IntrinsicElements
}

/**
 * Drop-in component that applies the paragraph-breath effect to its children.
 */
export const ParagraphBreathText = forwardRef<HTMLElement, ParagraphBreathTextProps>(
	function ParagraphBreathText({ children, className, style, as: Tag = 'p', ...options }, _ref) {
		const innerRef = useParagraphBreath(options)
		return (
			<Tag ref={innerRef as React.Ref<HTMLParagraphElement>} className={className} style={style}>
				{children}
			</Tag>
		)
	},
)

ParagraphBreathText.displayName = 'ParagraphBreathText'
