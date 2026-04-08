import { computed } from 'vue'

/** Matches `useAppShellHead` titleTemplate: `{chunk} · {appName}`. */
export function useSeoDisplayTitle(titleI18nKey: string) {
  const { t } = useT()
  return computed(() => `${t(titleI18nKey)} · ${t('common.appName')}`)
}
