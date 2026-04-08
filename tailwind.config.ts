import { type Config } from "tailwindcss";

const semanticColor = (token: string) =>
	`rgb(var(--color-${token}) / <alpha-value>)`;

export default {
	darkMode: "class",
	content: [
		"{routes,islands,components,utils}/**/*.{ts,tsx,js,jsx}",
	],
	theme: {
		extend: {
			colors: {
				lume: semanticColor("lume"),
				vapor: semanticColor("vapor"),
				deep: semanticColor("deep"),
				background: semanticColor("background"),
				surface: {
					DEFAULT: semanticColor("surface"),
					dim: semanticColor("surface-dim"),
					bright: semanticColor("surface-bright"),
					container: {
						lowest: semanticColor("surface-container-lowest"),
						low: semanticColor("surface-container-low"),
						DEFAULT: semanticColor("surface-container"),
						high: semanticColor("surface-container-high"),
						highest: semanticColor("surface-container-highest"),
					},
					variant: semanticColor("surface-variant"),
				},
				outline: {
					DEFAULT: semanticColor("outline"),
					variant: semanticColor("outline-variant"),
				},
				primary: {
					DEFAULT: semanticColor("primary"),
					container: semanticColor("primary-container"),
					fixed: semanticColor("primary-fixed"),
					"fixed-dim": semanticColor("primary-fixed-dim"),
				},
				secondary: {
					DEFAULT: semanticColor("secondary"),
					container: semanticColor("secondary-container"),
					fixed: semanticColor("secondary-fixed"),
					"fixed-dim": semanticColor("secondary-fixed-dim"),
				},
				tertiary: {
					DEFAULT: semanticColor("tertiary"),
					container: semanticColor("tertiary-container"),
					fixed: semanticColor("tertiary-fixed"),
					"fixed-dim": semanticColor("tertiary-fixed-dim"),
				},
				error: {
					DEFAULT: semanticColor("error"),
					container: semanticColor("error-container"),
				},
				"on-background": semanticColor("on-background"),
				"on-surface": semanticColor("on-surface"),
				"on-surface-variant": semanticColor("on-surface-variant"),
				"on-primary": semanticColor("on-primary"),
				"on-primary-container": semanticColor("on-primary-container"),
				"on-secondary": semanticColor("on-secondary"),
				"on-secondary-container": semanticColor("on-secondary-container"),
				"on-tertiary": semanticColor("on-tertiary"),
				"on-tertiary-container": semanticColor("on-tertiary-container"),
				"inverse-surface": semanticColor("inverse-surface"),
				"inverse-on-surface": semanticColor("inverse-on-surface"),
				"inverse-primary": semanticColor("inverse-primary"),
				"on-error": semanticColor("on-error"),
				"on-error-container": semanticColor("on-error-container"),
			},
			fontFamily: {
				headline: ["Newsreader", "serif"],
				body: ["Manrope", "sans-serif"],
				label: ["Manrope", "sans-serif"],
			},
			borderRadius: {
				DEFAULT: "var(--radius-default)",
				lg: "var(--radius-lg)",
				xl: "var(--radius-xl)",
				soft: "var(--radius-soft)",
			},
			boxShadow: {
				surface: "var(--shadow-surface)",
				"primary-glow": "var(--shadow-primary-glow)",
				"primary-glow-hover": "var(--shadow-primary-glow-hover)",
				"nav-elevated": "var(--shadow-nav-elevated)",
			},
			transitionTimingFunction: {
				standard: "cubic-bezier(0.4, 0, 0.2, 1)",
			},
			backdropBlur: {
				glass: "20px",
			},
		},
	},
} satisfies Config;
