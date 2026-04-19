import Demo from "@/components/Demo"
import CopyInstall from "@/components/CopyInstall"
import CodeBlock from "@/components/CodeBlock"
import ToolDirectory from "@/components/ToolDirectory"
import { version } from "../../../package.json"
import { version as siteVersion } from "../../package.json"
import SiteFooter from "../components/SiteFooter"

export default function Home() {
	return (
		<main className="flex flex-col items-center px-6 py-20 gap-24">

			{/* Hero */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<p className="text-xs uppercase tracking-widest opacity-50">textbreath</p>
					<h1 className="text-4xl lg:text-8xl xl:text-9xl" style={{ fontFamily: "var(--font-merriweather), serif", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: "1.05em" }}>
						The paragraph<br />
						<span style={{ opacity: 0.5, fontStyle: "italic" }}>breathes.</span>
					</h1>
				</div>
				<div className="flex items-center gap-4">
					<CopyInstall />
					<a href="https://github.com/Liiift-Studio/TextBreath" className="text-sm opacity-50 hover:opacity-100 transition-opacity">GitHub</a>
				</div>
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-50 tracking-wide">
					<span>TypeScript</span><span>·</span><span>Zero dependencies</span><span>·</span><span>React + Vanilla JS</span>
				</div>
				<p className="text-base opacity-60 leading-relaxed max-w-lg">
					Each line of a paragraph oscillates its letter-spacing — or variable font axis — at a phase offset from its neighbours. Two modes: <em>phase</em> gives each line a fixed ripple; <em>tide</em> sends a traveling wave through the paragraph. At low amplitudes it reads as living rather than animated.
				</p>
			</section>

			{/* Demo */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-4">
				<p className="text-xs uppercase tracking-widest opacity-50">Live demo — watch the paragraph</p>
				<div className="rounded-xl -mx-8 px-8 py-8" style={{ background: "rgba(0,0,0,0.25)", overflow: 'hidden' }}>
					<Demo />
				</div>
			</section>

			{/* Explanation */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<p className="text-xs uppercase tracking-widest opacity-50">How it works</p>
				<div className="prose-grid grid grid-cols-1 sm:grid-cols-2 gap-12 text-sm leading-relaxed opacity-70">
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">Phase mode</p>
						<p>Each visual line is assigned a fixed phase offset. The wave function is evaluated at each line&apos;s phase every frame. Lines oscillate in place at staggered positions in the cycle — a standing ripple rather than a wave that moves.</p>
					</div>
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">Tide mode</p>
						<p>A wave travels through the paragraph from top to bottom (or bottom to top). Each line&apos;s phase advances with time and its position in the paragraph — the same wave that passes through floodText, but applied to letter-spacing or a variable font axis.</p>
					</div>
				</div>
			</section>

			{/* Usage */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<div className="flex items-baseline gap-4">
					<p className="text-xs uppercase tracking-widest opacity-50">Usage</p>
				</div>
				<div className="flex flex-col gap-8 text-sm">
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Drop-in component</p>
						<CodeBlock code={`import { BreatheText } from '@liiift-studio/textbreath'

<BreatheText amplitude={0.012} period={3.5} phaseOffset={0.785}>
  Your paragraph text here...
</BreatheText>`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Hook</p>
						<CodeBlock code={`import { useBreathe } from '@liiift-studio/textbreath'

const ref = useBreathe({ amplitude: 0.012, period: 3.5, phaseOffset: 0.785 })
<p ref={ref}>{children}</p>`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Vanilla JS</p>
						<CodeBlock code={`import { applyBreathe, startBreathe, removeBreathe, getCleanHTML } from '@liiift-studio/textbreath'

const el = document.querySelector('p')
const original = getCleanHTML(el)
const { lineSpans } = applyBreathe(el, original, { amplitude: 0.012, period: 3.5 })
const stop = startBreathe(lineSpans, { amplitude: 0.012, period: 3.5 })

// Later — stop animation and restore:
stop()
removeBreathe(el, original)`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Options</p>
						<table className="w-full text-xs">
							<thead><tr className="opacity-50 text-left"><th className="pb-2 pr-6 font-normal">Option</th><th className="pb-2 pr-6 font-normal">Default</th><th className="pb-2 font-normal">Description</th></tr></thead>
							<tbody className="opacity-70">
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">amplitude</td><td className="py-2 pr-6">0.012</td><td className="py-2">Peak change per cycle. Em for letter-spacing; scaled by 100/400 for wdth/wght.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">period</td><td className="py-2 pr-6">3.5</td><td className="py-2">Seconds per full oscillation cycle.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">phaseOffset</td><td className="py-2 pr-6">π/4</td><td className="py-2">Phase shift between adjacent lines in radians. Used in phase mode only.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">waveShape</td><td className="py-2 pr-6">&apos;sine&apos;</td><td className="py-2">&apos;sine&apos; | &apos;triangle&apos;</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">axis</td><td className="py-2 pr-6">&apos;letter-spacing&apos;</td><td className="py-2">&apos;letter-spacing&apos; | &apos;wdth&apos; | &apos;wght&apos;</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">mode</td><td className="py-2 pr-6">&apos;phase&apos;</td><td className="py-2">&apos;phase&apos; = standing ripple per line, &apos;tide&apos; = wave travels through paragraph.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">direction</td><td className="py-2 pr-6">&apos;down&apos;</td><td className="py-2">Tide travel direction. &apos;down&apos; | &apos;up&apos;. Used in tide mode only.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">lineDetection</td><td className="py-2 pr-6">&apos;bcr&apos;</td><td className="py-2">&apos;bcr&apos; reads actual browser layout — ground truth, works with any font and inline HTML. &apos;canvas&apos; uses <a href="https://github.com/chenglou/pretext" className="underline opacity-70">@chenglou/pretext</a> for arithmetic line breaking with no forced reflow on resize. Install pretext separately.</td></tr>
							</tbody>
						</table>
					</div>
				</div>
			</section>

			<SiteFooter current="textBreath" npmVersion={version} siteVersion={siteVersion} />

		</main>
	)
}
