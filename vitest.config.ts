// vitest.config.ts — test configuration
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [react()],
	test: {
		environment: 'happy-dom',
		include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
	},
})
