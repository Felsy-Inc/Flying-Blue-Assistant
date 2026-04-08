<script setup lang="ts">
definePageMeta({ i18n: false })

const localePath = useLocalePath()
await navigateTo(localePath('/login'), { replace: true })
</script>

<template>
  <div />
</template>
