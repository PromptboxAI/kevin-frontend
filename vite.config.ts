import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Honour PORT when the environment sets one. Vite does not read it on its
    // own, so two dev servers on this repo both tried to bind 5173 and the
    // second failed. With PORT unset this is `undefined`, i.e. exactly Vite's
    // default (5173) -- so an existing server's behaviour is unchanged.
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
})
