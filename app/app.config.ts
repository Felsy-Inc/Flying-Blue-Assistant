export default defineAppConfig({
  ui: {
    /**
     * Nuxt 4 loads `app.config` from the `app/` directory only — root `app.config.ts` is ignored.
     * Nuxt UI v4: semantic palette lives under `ui.colors`.
     */
    colors: {
      primary: 'blue',
      neutral: 'zinc',
    },
    button: {
      slots: {
        base: 'rounded-xl cursor-pointer transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-200 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-default disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:opacity-60 aria-disabled:cursor-not-allowed',
      },
    },
    link: {
      base: 'rounded-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-default',
      variants: {
        disabled: {
          true: 'cursor-not-allowed opacity-60',
        },
      },
    },
    badge: {
      slots: {
        base: 'font-semibold tracking-wide rounded-md',
      },
    },
  },
})
