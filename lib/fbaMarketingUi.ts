/**
 * Shared Nuxt UI slot overrides for marketing pages (FAQ accordions, etc.).
 * Keeps brand styling consistent without duplicating long `ui` objects.
 */
export const fbaMarketingAccordionUi = {
  root: 'w-full max-w-3xl space-y-2',
  item:
    '!border-b-0 rounded-xl border border-default/55 bg-default/45 shadow-sm ring-1 ring-default/[0.07] transition-[border-color,box-shadow] hover:border-default/70 data-[state=open]:border-primary/35 data-[state=open]:shadow-md dark:border-default/45 dark:bg-elevated/25 dark:ring-white/[0.06] dark:hover:border-default/55 dark:data-[state=open]:border-primary/35',
  trigger:
    'cursor-pointer px-4 py-4 text-base font-semibold text-highlighted hover:bg-elevated/45 focus-visible:outline-offset-[-2px] dark:hover:bg-elevated/20',
  body: 'border-t border-default/35 px-4 pb-4 pt-3 text-sm leading-relaxed text-muted dark:border-default/30',
  trailingIcon: 'size-5 text-dimmed group-data-[state=open]:rotate-180',
} as const
