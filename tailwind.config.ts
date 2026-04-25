import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

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
        sans:    ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Inter', 'system-ui', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
        body:    ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'SF Mono', 'ui-monospace', 'Menlo', 'monospace'],
        num:     ['JetBrains Mono', 'SF Mono', 'ui-monospace', 'Menlo', 'monospace'],
        terminal:['JetBrains Mono', 'SF Mono', 'ui-monospace', 'Menlo', 'monospace'],
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
        purple: { accent: "hsl(var(--apple-purple))" },
        state: {
          success: "hsl(var(--state-success))",
          warning: "hsl(var(--state-warning))",
          error: "hsl(var(--state-error))",
          info: "hsl(var(--state-info))",
          focus: "hsl(var(--state-focus))",
        },
        // ── APPLE PREMIUM TOKENS ──
        electric: {
          DEFAULT: "hsl(var(--electric-blue))",
          bright:  "hsl(var(--electric-blue-bright))",
          soft:    "hsl(var(--electric-blue-soft))",
        },
        apple: {
          green:  "hsl(var(--apple-green))",
          red:    "hsl(var(--apple-red))",
          orange: "hsl(var(--apple-orange))",
          purple: "hsl(var(--apple-purple))",
          cyan:   "hsl(var(--apple-cyan))",
          pink:   "hsl(var(--apple-pink))",
          indigo: "hsl(var(--apple-indigo))",
        },
        space: {
          900: "hsl(var(--space-gray-900))",
          800: "hsl(var(--space-gray-800))",
          700: "hsl(var(--space-gray-700))",
          600: "hsl(var(--space-gray-600))",
          500: "hsl(var(--space-gray-500))",
          400: "hsl(var(--space-gray-400))",
          300: "hsl(var(--space-gray-300))",
          200: "hsl(var(--space-gray-200))",
          100: "hsl(var(--space-gray-100))",
        },
        // Legacy shims so old classnames don't break
        phosphor: {
          DEFAULT: "hsl(var(--space-gray-100))",
          dim:     "hsl(var(--space-gray-300))",
          glow:    "hsl(var(--space-gray-100))",
        },
        amber:   { term: "hsl(var(--apple-orange))", dim: "hsl(var(--apple-orange))" },
        "cyan": { term: "hsl(var(--apple-cyan))" },
        danger:  { DEFAULT: "hsl(var(--apple-red))" },
        carbon:  {
          DEFAULT: "hsl(var(--space-gray-700))",
          dark:    "hsl(var(--space-gray-900))",
          light:   "hsl(var(--space-gray-600))",
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'electric-glow':    'radial-gradient(ellipse at top, hsl(var(--electric-blue) / 0.18) 0%, transparent 60%)',
        'premium-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        ios: "10px",
        'ios-card': "14px",
        'ios-sheet': "22px",
      },
      boxShadow: {
        'elegant': 'var(--shadow-elegant)',
        'glow': 'var(--shadow-glow)',
        'premium-sm':
          '0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)',
        'premium':
          'inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 3px rgba(0,0,0,0.3), 0 10px 30px -10px rgba(0,0,0,0.4)',
        'premium-lg':
          'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 10px rgba(0,0,0,0.3), 0 20px 50px -10px rgba(0,0,0,0.45)',
        'electric':
          '0 0 0 1px hsl(var(--electric-blue) / 0.25), 0 0 24px hsl(var(--electric-blue) / 0.18)',
        'electric-strong':
          '0 0 0 1px hsl(var(--electric-blue) / 0.4), 0 0 36px hsl(var(--electric-blue) / 0.3)',
        'apple-green':
          '0 0 0 1px hsl(var(--apple-green) / 0.25), 0 0 24px hsl(var(--apple-green) / 0.18)',
        'apple-red':
          '0 0 0 1px hsl(var(--apple-red) / 0.3), 0 0 24px hsl(var(--apple-red) / 0.2)',
        // Legacy shims
        'phosphor': '0 0 0 1px hsl(var(--electric-blue) / 0.25), 0 0 24px hsl(var(--electric-blue) / 0.15)',
        'phosphor-strong': '0 0 0 1px hsl(var(--electric-blue) / 0.4), 0 0 36px hsl(var(--electric-blue) / 0.25)',
        'amber-glow': '0 0 0 1px hsl(var(--apple-orange) / 0.25), 0 0 24px hsl(var(--apple-orange) / 0.18)',
        'danger-glow': '0 0 0 1px hsl(var(--apple-red) / 0.3), 0 0 24px hsl(var(--apple-red) / 0.2)',
        'inset-term': 'inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "slide-in-top":   { "0%": { transform: "translateY(-16px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        "fade-in":        { "0%": { opacity: "0", transform: "translateY(6px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "slide-up":       { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-in-scale":  { "0%": { opacity: "0", transform: "scale(0.96)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        "pulse-subtle":   { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.75" } },
        "pulse-glow":     { "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--electric-blue) / 0)" }, "50%": { boxShadow: "0 0 0 8px hsl(var(--electric-blue) / 0.12)" } },
        "breathing-ring":{ "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--electric-blue) / 0.5)" }, "50%": { boxShadow: "0 0 0 8px hsl(var(--electric-blue) / 0)" } },
        "shimmer":        { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(100%)" } },
        "shake":          { "0%, 100%": { transform: "translateX(0)" }, "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-3px)" }, "20%, 40%, 60%, 80%": { transform: "translateX(3px)" } },
        "pulse-error":    { "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--apple-red) / 0.4)" }, "50%": { boxShadow: "0 0 0 8px hsl(var(--apple-red) / 0), 0 0 20px hsl(var(--apple-red) / 0.3)" } },
        "float":          { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        "ios-pulse":      { "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--apple-green) / 0.5)" }, "50%": { boxShadow: "0 0 0 6px hsl(var(--apple-green) / 0)" } },
        "blink":          { "0%, 49%": { opacity: "1" }, "50%, 100%": { opacity: "0" } },
      },
      animation: {
        "accordion-down":   "accordion-down 0.2s ease-out",
        "accordion-up":     "accordion-up 0.2s ease-out",
        "slide-in-top":     "slide-in-top 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-in":          "fade-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "slide-up":         "slide-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-in-scale":    "fade-in-scale 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "pulse-subtle":     "pulse-subtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-glow":       "pulse-glow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "breathing-ring":   "breathing-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer":          "shimmer 2.5s ease-in-out infinite",
        "shake":            "shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97)",
        "pulse-error":      "pulse-error 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float":            "float 4s ease-in-out infinite",
        "ios-pulse":        "ios-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "blink":            "blink 1s step-end infinite",
        "cursor-blink":     "blink 1s step-end infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
