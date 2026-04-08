<script setup lang="ts">
import { computed } from 'vue'
import { locales, type Locale } from '~lib/i18n'

const { t } = useT()
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
    void setLocale(v)
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
