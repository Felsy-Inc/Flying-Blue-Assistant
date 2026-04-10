<script setup lang="ts">
import type { SupabaseClient } from '@supabase/supabase-js'
import { computed } from 'vue'
import { syncSupabaseUserLocale } from '~lib/auth/sync-user-locale'
import { locales, type Locale } from '~lib/i18n'

const { t } = useT()
const nuxtApp = useNuxtApp()
const { locale, setLocale } = useI18n()

const localeItems = computed(() =>
  locales.map((code) => ({
    label: t(`locale.names.${code}`),
    value: code,
  })),
)

const localeModel = computed({
  get: () => locale.value as Locale,
  set: (v: Locale) => {
    void (async () => {
      await setLocale(v)
      const client = (nuxtApp.$supabase as { client: SupabaseClient } | undefined)?.client
      await syncSupabaseUserLocale(client, v)
    })()
  },
})
</script>

<template>
  <USelect
    v-model="localeModel"
    :items="localeItems"
    value-key="value"
    label-key="label"
    size="sm"
    class="w-[min(11rem,42vw)]"
    :aria-label="t('header.language')"
  />
</template>
