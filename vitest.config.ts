// vitest.config.ts — test configuration
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'happy-dom',
		include: ['src/__tests__/**/*.test.ts'],
	},
})
