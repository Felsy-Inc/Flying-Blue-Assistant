<script setup lang="ts">
definePageMeta({ i18n: false })

const localePath = useLocalePath()
await navigateTo(localePath('/app/search'), { replace: true })
</script>

<template>
  <div />
</template>
