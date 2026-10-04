import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

/**
 * F69 (ADR 007) : politique de sécurité du contenu injectée au build seulement (le serveur de dev a besoin de
 * scripts en ligne pour le rechargement à chaud). Appels et flux SSE autorisés vers l’origine de l’API uniquement.
 */
function contentSecurityPolicy(): Plugin {
  let apiBaseUrl: string | undefined
  return {
    name: "nova-terra-csp",
    apply: "build",
    configResolved(config) {
      apiBaseUrl = config.env.VITE_API_BASE_URL as string | undefined
    },
    transformIndexHtml() {
      const api = apiBaseUrl ? new URL(apiBaseUrl).origin : ""
      const policy = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        `connect-src 'self' ${api}`.trim(),
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; ")
      return [
        { tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: policy }, injectTo: "head-prepend" },
        { tag: "meta", attrs: { name: "referrer", content: "strict-origin-when-cross-origin" }, injectTo: "head-prepend" },
      ]
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    contentSecurityPolicy(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    host: true,
  },
  // L17 (F58/F61) : bibliothèques stables dans des morceaux séparés (mis en cache d’une version à l’autre),
  // pages chargées à la demande (`routes.tsx`).
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/.test(id)) return "react"
          if (/[\\/]node_modules[\\/](@reduxjs|redux|react-redux|immer|reselect)[\\/]/.test(id)) return "redux"
          if (/[\\/]node_modules[\\/](radix-ui|@radix-ui|@base-ui|@floating-ui)[\\/]/.test(id)) return "ui"
          return undefined
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    }
  }
})
