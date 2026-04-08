import { computed } from 'vue'

/** Thin wrapper around Nuxt Color Mode (provided by Nuxt UI v4). */
export const useColorTheme = () => {
  const colorMode = useColorMode()

  const isDark = computed(() => colorMode.value === 'dark')

  const toggleTheme = () => {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }

  return {
    isDark,
    toggleTheme,
  }
}
