import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // Terminal is the default
        sans:    ['JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'ui-monospace', 'monospace'],
        mono:    ['JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'ui-monospace', 'monospace'],
        display: ['IBM Plex Mono', 'JetBrains Mono', 'monospace'],
        body:    ['JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
        // Legacy — for anything that truly needs proportional
        'sans-fallback': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        neon: {
          green: "hsl(var(--neon-green))",
          red: "hsl(var(--neon-red))",
        },
        purple: {
          accent: "hsl(var(--purple-accent))",
        },
        state: {
          success: "hsl(var(--state-success))",
          warning: "hsl(var(--state-warning))",
          error: "hsl(var(--state-error))",
          info: "hsl(var(--state-info))",
          focus: "hsl(var(--state-focus))",
        },
        // ── TERMINAL PALETTE ──
        phosphor: {
          DEFAULT: "hsl(var(--phosphor))",
          dim:     "hsl(var(--phosphor-dim))",
          glow:    "hsl(var(--phosphor-glow))",
        },
        amber: {
          term:    "hsl(var(--amber))",
          dim:     "hsl(var(--amber-dim))",
        },
        cyan: {
          term:    "hsl(var(--cyan-term))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
        },
        carbon: {
          DEFAULT: "hsl(150 40% 4%)",
          dark:    "hsl(150 30% 2%)",
          light:   "hsl(150 25% 8%)",
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'scanlines': 'repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,255,60,0.06) 2px, rgba(0,255,60,0.06) 3px)',
        'phosphor-grid': 'linear-gradient(rgba(0,255,60,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,60,0.06) 1px, transparent 1px)',
      },
      borderRadius: {
        // near-zero roundness — terminal aesthetic
        lg: "var(--radius)",
        md: "calc(var(--radius))",
        sm: "0",
      },
      boxShadow: {
        'elegant': 'var(--shadow-elegant)',
        'glow': 'var(--shadow-glow)',
        'phosphor': '0 0 12px hsl(var(--phosphor) / 0.35), 0 0 32px hsl(var(--phosphor) / 0.12)',
        'phosphor-strong': '0 0 20px hsl(var(--phosphor) / 0.55), 0 0 60px hsl(var(--phosphor) / 0.2)',
        'amber-glow': '0 0 12px hsl(var(--amber) / 0.35), 0 0 32px hsl(var(--amber) / 0.12)',
        'danger-glow': '0 0 14px hsl(var(--danger) / 0.4), 0 0 36px hsl(var(--danger) / 0.15)',
        'inset-term': 'inset 0 0 0 1px hsl(var(--phosphor) / 0.35)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "slide-in-top": {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-scale": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.82" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 12px hsl(var(--phosphor) / 0.3)" },
          "50%":      { boxShadow: "0 0 28px hsl(var(--phosphor) / 0.75), 0 0 60px hsl(var(--phosphor) / 0.25)" },
        },
        "breathing-ring": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--phosphor) / 0.7)" },
          "50%":      { boxShadow: "0 0 0 8px hsl(var(--phosphor) / 0)" },
        },
        "shimmer": {
          "0%":   { transform: "translateX(-100%)", opacity: "0" },
          "50%":  { opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        "shake": {
          "0%, 100%":   { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%":  { transform: "translateX(4px)" },
        },
        "cursor-blink": {
          "0%, 49%":   { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        "flicker": {
          "0%, 18%, 22%, 25%, 53%, 57%, 100%": { opacity: "1" },
          "20%, 24%, 55%":                      { opacity: "0.88" },
        },
        "crt-beam": {
          "0%":   { transform: "translateY(-100vh)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "scan-vertical": {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "glitch-slide": {
          "0%":   { transform: "translate(0)" },
          "20%":  { transform: "translate(-2px, 1px)" },
          "40%":  { transform: "translate(2px, -1px)" },
          "60%":  { transform: "translate(-1px, -1px)" },
          "80%":  { transform: "translate(1px, 1px)" },
          "100%": { transform: "translate(0)" },
        },
        "pulse-expand": {
          "0%":   { transform: "scale(1)",   opacity: "0.8" },
          "100%": { transform: "scale(3.5)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down":   "accordion-down 0.2s ease-out",
        "accordion-up":     "accordion-up 0.2s ease-out",
        "slide-in-top":     "slide-in-top 0.4s ease-out",
        "fade-in":          "fade-in 0.3s ease-out",
        "slide-up":         "slide-up 0.4s ease-out",
        "fade-in-scale":    "fade-in-scale 0.3s ease-out",
        "pulse-subtle":     "pulse-subtle 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-glow":       "pulse-glow 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "breathing-ring":   "breathing-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer":          "shimmer 8s ease-in-out infinite",
        "shake":            "shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)",
        "cursor-blink":     "cursor-blink 1s step-end infinite",
        "flicker":          "flicker 4s linear infinite",
        "crt-beam":         "crt-beam 8s linear infinite",
        "scan-vertical":    "scan-vertical 3s ease-in-out infinite",
        "glitch-slide":     "glitch-slide 0.4s ease-in-out infinite",
        "pulse-expand":     "pulse-expand 1.8s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
