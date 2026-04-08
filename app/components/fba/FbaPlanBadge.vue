<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  plan: 'free' | 'pro'
}>()

const { t } = useT()

const label = computed(() =>
  props.plan === 'free' ? t('pricing.plans.free.name') : t('pricing.plans.pro.name'),
)

const color = computed(() => (props.plan === 'pro' ? 'primary' : 'neutral'))
</script>

<template>
  <UBadge
    :color="color"
    variant="subtle"
    size="sm"
    class="uppercase tracking-wider ring-1 ring-inset ring-default/20 dark:ring-white/10"
  >
    {{ label }}
  </UBadge>
</template>
