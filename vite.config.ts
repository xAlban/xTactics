import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig(async ({ mode }) => {
  const plugins: PluginOption[] = [react(), tailwindcss()]

  // ---- Only load Electron plugins when running in electron mode ----
  if (mode === 'electron') {
    const electron = (await import('vite-plugin-electron')).default
    const electronRenderer = (await import('vite-plugin-electron-renderer'))
      .default
    plugins.push(
      electron([
        {
          entry: 'electron/main.ts',
          vite: {
            build: {
              outDir: 'dist-electron',
            },
          },
        },
        {
          entry: 'electron/preload.ts',
          onstart(args: { reload: () => void }) {
            args.reload()
          },
          vite: {
            build: {
              outDir: 'dist-electron',
            },
          },
        },
      ]),
      electronRenderer(),
    )
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
