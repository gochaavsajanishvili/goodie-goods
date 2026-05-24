import { defineSharedVitestConfig } from '@goodie-goods/shared/vitest-base';
import react from '@vitejs/plugin-react';

export default defineSharedVitestConfig({
  environment: 'happy-dom',
  include: ['src/**/*.test.{ts,tsx}'],
  plugins: [react()],
});
