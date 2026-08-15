import type { Config } from "tailwindcss";

/**
 * @file tailwind.config.ts
 * @description Central Tailwind CSS configuration for Eduland Portal.
 * Contains official Eduland brand color definitions for `olive` (primary green)
 * and `schoolYellow` (accent gold). Do not edit individual component files;
 * all existing utility classes automatically inherit these exact brand hex values.
 */

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        /** Official Eduland Primary Green Ramp (#269D43) */
        olive: {
          50: "#EAF3DE",
          100: "#D3E8C2",
          200: "#B0D695",
          300: "#8AC168",
          400: "#5CA83F",
          500: "#3D9331",
          600: "#269D43",
          700: "#1B7A34",
          800: "#145E28",
          900: "#0D451D",
          950: "#082E13",
        },

        /** Official Eduland Accent Gold Ramp (#D4AF37) */
        schoolYellow: {
          50: "#FDF8E8",
          100: "#FAEEC3",
          200: "#F4DD8E",
          300: "#EDCB5C",
          400: "#DFBB44",
          500: "#D4AF37",
          600: "#B8952B",
          700: "#8A6D1F",
          800: "#5E4A15",
          900: "#3A2D0D",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
