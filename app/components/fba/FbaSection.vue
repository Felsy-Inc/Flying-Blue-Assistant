<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
    /** Tighter rhythm for in-app pages (dashboard, alerts, etc.). */
    variant?: 'default' | 'app'
  }>(),
  { variant: 'default' },
)
</script>

<template>
  <section :class="variant === 'app' ? 'py-6 md:py-8' : 'py-10 md:py-14'">
    <div
      v-if="title || description"
      :class="[
        variant === 'app' ? 'mb-5 space-y-2 md:mb-6' : 'mb-8 space-y-3',
        variant === 'default' && title
          ? 'border-l-2 border-primary/20 ps-4 md:ps-5 dark:border-primary/25'
          : '',
      ]"
    >
      <h2
        v-if="title"
        class="font-semibold tracking-tight text-highlighted"
        :class="variant === 'app' ? 'text-lg md:text-xl' : 'text-xl md:text-2xl md:tracking-tighter'"
      >
        {{ title }}
      </h2>
      <p
        v-if="description"
        class="fba-muted-copy max-w-2xl text-[0.9375rem] leading-relaxed md:text-base"
      >
        {{ description }}
      </p>
    </div>
    <slot />
  </section>
</template>
