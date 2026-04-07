"use client"

import { useState, useDeferredValue } from "react"
import { BreatheText } from "@liiift-studio/text-breath"

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

/** Interactive demo for breathe with amplitude, period, phase, wave shape and axis controls */
export default function Demo() {
	const [amplitude, setAmplitude] = useState(0.012)
	const [period, setPeriod] = useState(3.5)
	const [phaseOffset, setPhaseOffset] = useState(Math.round(Math.PI / 4 * 100) / 100)
	const [waveShape, setWaveShape] = useState<'sine' | 'triangle'>('sine')
	const [axis, setAxis] = useState<'letter-spacing' | 'wdth'>('letter-spacing')

	const dAmplitude = useDeferredValue(amplitude)
	const dPeriod = useDeferredValue(period)
	const dPhaseOffset = useDeferredValue(phaseOffset)

	const sampleStyle: React.CSSProperties = {
		fontFamily: "var(--font-merriweather), serif",
		fontSize: "1.125rem",
		lineHeight: "1.8",
	}

	return (
		<div className="w-full">
			<div className="grid grid-cols-3 gap-6 mb-6">
				<Slider label="Amplitude" value={amplitude} min={0.002} max={0.06} step={0.001} fmt={v => v.toFixed(3)} onChange={setAmplitude} />
				<Slider label="Period (s)" value={period} min={1} max={10} step={0.5} onChange={setPeriod} />
				<Slider label="Phase offset" value={phaseOffset} min={0.1} max={Math.round(Math.PI * 100) / 100} step={0.05} fmt={v => v.toFixed(2)} onChange={setPhaseOffset} />
			</div>
			<div className="flex flex-wrap items-center gap-3 mb-8">
				<span className="text-xs uppercase tracking-widest opacity-50">Wave</span>
				{(['sine', 'triangle'] as const).map(v => (
					<button key={v} onClick={() => setWaveShape(v)} className="text-xs px-3 py-1 rounded-full border transition-opacity" style={{ borderColor: 'currentColor', opacity: waveShape === v ? 1 : 0.5, background: waveShape === v ? 'var(--btn-bg)' : 'transparent' }}>{v}</button>
				))}
				<span className="text-xs uppercase tracking-widest opacity-50 ml-4">Axis</span>
				{(['letter-spacing', 'wdth'] as const).map(v => (
					<button key={v} onClick={() => setAxis(v)} className="text-xs px-3 py-1 rounded-full border transition-opacity" style={{ borderColor: 'currentColor', opacity: axis === v ? 1 : 0.5, background: axis === v ? 'var(--btn-bg)' : 'transparent' }}>{v}</button>
				))}
			</div>
			<BreatheText amplitude={dAmplitude} period={dPeriod} phaseOffset={dPhaseOffset} waveShape={waveShape} axis={axis} style={sampleStyle}>
				{SAMPLE}
			</BreatheText>
			<p className="text-xs opacity-50 italic mt-6">Each line oscillates at ±{amplitude.toFixed(3)} {axis === 'letter-spacing' ? 'em' : 'wdth units'}, period {period}s, phase offset {phaseOffset.toFixed(2)} rad per line.</p>
		</div>
	)
}
