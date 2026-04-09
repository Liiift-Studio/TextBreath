"use client"

import { useState, useEffect, useDeferredValue } from "react"
import { BreatheText } from "@liiift-studio/textbreath"

const SAMPLE = `Hold still and watch the paragraph. Each line is breathing at its own pace — expanding and contracting its letter-spacing in a slow oscillation, offset from its neighbours by a fixed phase angle. The top lines and the bottom lines never breathe together. A wave moves through the paragraph rather than a pulse. At the default amplitude the movement is almost subliminal: you notice something alive before you notice what it is. Increase the amplitude to see the mechanics. The wave shape changes the character of the motion — sine is smooth, triangle is more mechanical. The period controls how fast each line completes its cycle.`

/** Labelled range input with formatted value display */
function Slider({ label, value, min, max, step, fmt, onChange }: { label: string; value: number; min: number; max: number; step: number; fmt?: (v: number) => string; onChange: (v: number) => void }) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-xs uppercase tracking-widest opacity-50">{label}</span>
			<input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={e => onChange(Number(e.target.value))} onTouchStart={e => e.stopPropagation()} style={{ touchAction: 'none' }} />
			<span className="tabular-nums text-xs opacity-50 text-right">{fmt ? fmt(value) : value}</span>
		</div>
	)
}

/** Before/after toggle — left half = without effect, right half filled = with effect */
function BeforeAfterToggle({ active, onClick }: { active: boolean; onClick: () => void }) {
	return (
		<button
			onClick={onClick}
			aria-label="Toggle before/after comparison"
			title={active ? 'Hide comparison' : 'Compare without effect'}
			style={{
				position: 'absolute', bottom: 0, right: 0,
				width: 32, height: 32, borderRadius: '50%',
				border: '1px solid currentColor',
				opacity: active ? 0.8 : 0.25,
				background: 'transparent',
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				cursor: 'pointer', transition: 'opacity 0.15s ease',
			}}
		>
			<svg width="14" height="10" viewBox="0 0 14 10" fill="none">
				<rect x="0.5" y="0.5" width="13" height="9" rx="1" stroke="currentColor" strokeWidth="1"/>
				<line x1="7" y1="0.5" x2="7" y2="9.5" stroke="currentColor" strokeWidth="1"/>
				<rect x="8" y="1.5" width="5" height="7" fill="currentColor"/>
			</svg>
		</button>
	)
}

type Axis = 'letter-spacing' | 'wdth' | 'wght'

/** Amplitude defaults per axis so slider range stays useful when switching */
const AXIS_AMPLITUDE_DEFAULTS: Record<Axis, number> = {
	'letter-spacing': 0.012,
	wdth: 0.1,
	wght: 0.2,
}

/** Interactive demo for breathe with amplitude, period, phase, wave shape, axis, and mode controls */
export default function Demo() {
	const [amplitude, setAmplitude] = useState(0.012)
	const [period, setPeriod] = useState(3.5)
	const [phaseOffset, setPhaseOffset] = useState(Math.round(Math.PI / 4 * 100) / 100)
	const [waveShape, setWaveShape] = useState<'sine' | 'triangle'>('sine')
	const [axis, setAxis] = useState<Axis>('letter-spacing')
	const [mode, setMode] = useState<'phase' | 'tide'>('phase')
	const [direction, setDirection] = useState<'down' | 'up'>('down')
	const [beforeAfter, setComparing] = useState(false)
	const [fontsReady, setFontsReady] = useState(false)

	useEffect(() => {
		document.fonts.ready.then(() => setFontsReady(true))
	}, [])

	const dAmplitude = useDeferredValue(amplitude)
	const dPeriod = useDeferredValue(period)
	const dPhaseOffset = useDeferredValue(phaseOffset)

	const sampleStyle: React.CSSProperties = {
		fontFamily: "var(--font-merriweather), serif",
		fontSize: "1.125rem",
		lineHeight: "1.8",
	}

	function handleAxisChange(v: Axis) {
		setAxis(v)
		setAmplitude(AXIS_AMPLITUDE_DEFAULTS[v])
	}

	const isLetterSpacing = axis === 'letter-spacing'
	const amplitudeLabel = isLetterSpacing ? 'Amplitude (em)' : `Amplitude (× ${axis === 'wght' ? '400' : '100'} ${axis} units)`
	const amplitudeMax = isLetterSpacing ? 0.06 : axis === 'wght' ? 0.8 : 0.5
	const amplitudeStep = isLetterSpacing ? 0.001 : 0.01

	return (
		<div className="w-full">
			<div className="grid grid-cols-3 gap-6 mb-6">
				<Slider label={amplitudeLabel} value={amplitude} min={0} max={amplitudeMax} step={amplitudeStep} fmt={v => v.toFixed(3)} onChange={setAmplitude} />
				<Slider label="Period (s)" value={period} min={1} max={10} step={0.5} onChange={setPeriod} />
				{mode === 'phase' && (
					<Slider label="Phase offset" value={phaseOffset} min={0.1} max={Math.round(Math.PI * 100) / 100} step={0.05} fmt={v => v.toFixed(2)} onChange={setPhaseOffset} />
				)}
			</div>
			<div className="flex flex-wrap items-center gap-3 mb-8">
				<span className="text-xs uppercase tracking-widest opacity-50">Axis</span>
				{(['letter-spacing', 'wdth', 'wght'] as const).map(v => (
					<button key={v} onClick={() => handleAxisChange(v)} aria-pressed={axis === v} className="text-xs px-3 py-1 rounded-full border transition-opacity" style={{ borderColor: 'currentColor', opacity: axis === v ? 1 : 0.5, background: axis === v ? 'var(--btn-bg)' : 'transparent' }}>{v}</button>
				))}
				<span className="text-xs uppercase tracking-widest opacity-50 ml-4">Wave</span>
				{(['sine', 'triangle'] as const).map(v => (
					<button key={v} onClick={() => setWaveShape(v)} aria-pressed={waveShape === v} className="text-xs px-3 py-1 rounded-full border transition-opacity" style={{ borderColor: 'currentColor', opacity: waveShape === v ? 1 : 0.5, background: waveShape === v ? 'var(--btn-bg)' : 'transparent' }}>{v}</button>
				))}
				<span className="text-xs uppercase tracking-widest opacity-50 ml-4">Mode</span>
				{(['phase', 'tide'] as const).map(v => (
					<button key={v} onClick={() => setMode(v)} aria-pressed={mode === v} className="text-xs px-3 py-1 rounded-full border transition-opacity" style={{ borderColor: 'currentColor', opacity: mode === v ? 1 : 0.5, background: mode === v ? 'var(--btn-bg)' : 'transparent' }}>{v}</button>
				))}
				{mode === 'tide' && (
					<>
						<span className="text-xs uppercase tracking-widest opacity-50 ml-4">Dir</span>
						{(['down', 'up'] as const).map(v => (
							<button key={v} onClick={() => setDirection(v)} aria-pressed={direction === v} className="text-xs px-3 py-1 rounded-full border transition-opacity" style={{ borderColor: 'currentColor', opacity: direction === v ? 1 : 0.5, background: direction === v ? 'var(--btn-bg)' : 'transparent' }}>{v}</button>
						))}
					</>
				)}
			</div>
			<div className="relative pb-8">
				<BreatheText key={String(fontsReady)} amplitude={dAmplitude} period={dPeriod} phaseOffset={dPhaseOffset} waveShape={waveShape} axis={axis} mode={mode} direction={direction} style={sampleStyle}>
					{SAMPLE}
				</BreatheText>
				{beforeAfter && (
					<p aria-hidden style={{ ...sampleStyle, position: 'absolute', top: 0, left: 0, width: '100%', margin: 0, opacity: 0.25, pointerEvents: 'none' }}>{SAMPLE}</p>
				)}
				<BeforeAfterToggle active={beforeAfter} onClick={() => setComparing(v => !v)} />
			</div>
			<p className="text-xs opacity-50 italic mt-6">
				{mode === 'phase'
					? `Each line oscillates at ±${amplitude.toFixed(3)} ${axis === 'letter-spacing' ? 'em' : axis + ' units'}, period ${period}s, phase offset ${phaseOffset.toFixed(2)} rad per line.`
					: `A ${waveShape} wave traveling ${direction === 'down' ? 'top to bottom' : 'bottom to top'}, ±${amplitude.toFixed(3)} on the ${axis} axis every ${period}s.`
				}
			</p>
		</div>
	)
}
