import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
	title: "Breathe — Phased per-line letter-spacing oscillation",
	icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
	description: "Breathe gives text a breathing quality: each line oscillates its letter-spacing with a per-line phase offset, rippling in a slow wave. An ambient animation that feels organic rather than decorative.",
	keywords: ["breathe", "letter spacing animation", "typography", "TypeScript", "npm", "rAF", "oscillation"],
	openGraph: {
		title: "Breathe — Phased per-line letter-spacing oscillation",
		description: "Each line of text breathes at its own phase. A slow wave ripples through the paragraph.",
		url: "https://breathe.liiift.studio",
		siteName: "Breathe",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Breathe — Phased per-line letter-spacing oscillation",
		description: "Each line of text breathes at its own phase. A slow wave ripples through the paragraph.",
	},
	metadataBase: new URL("https://breathe.liiift.studio"),
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className="h-full antialiased">
			<body className="min-h-full flex flex-col">{children}</body>
		</html>
	)
}
