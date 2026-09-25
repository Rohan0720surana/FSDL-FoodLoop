import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The project lives in OneDrive, which turns files into reparse points.
  // Following them to their real path breaks module resolution, so don't.
  resolve: { preserveSymlinks: true },
})
