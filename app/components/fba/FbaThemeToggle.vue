<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const { t } = useT()
const { isDark, toggleTheme } = useColorTheme()

/** Avoid SSR/client mismatch: color mode resolves after cookie / system on client. */
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

const ariaLabel = computed(() =>
  mounted.value
    ? isDark.value
      ? t('header.themeLight')
      : t('header.themeDark')
    : t('header.themeToggle'),
)
</script>

<template>
  <UButton
    color="neutral"
    variant="ghost"
    square
    class="text-dimmed hover:text-highlighted"
    :aria-label="ariaLabel"
    @click="toggleTheme"
  >
    <ClientOnly>
      <UIcon
        :name="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'"
        class="size-5 shrink-0"
      />
      <template #fallback>
        <span class="inline-block size-5 shrink-0" aria-hidden="true" />
      </template>
    </ClientOnly>
  </UButton>
</template>
