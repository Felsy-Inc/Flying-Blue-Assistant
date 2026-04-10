<script setup lang="ts">
import { computed, ref } from 'vue'

definePageMeta({
  layout: 'marketing',
  i18n: false,
})

useSeoMeta({
  robots: 'noindex, nofollow',
})

const route = useRoute()
const router = useRouter()

const password = ref('')
const errorMsg = ref('')
const busy = ref(false)

const nextPath = computed(() => {
  const n = route.query.next
  const raw = typeof n === 'string' ? n : Array.isArray(n) ? n[0] : '/'
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) {
    return '/'
  }
  return raw
})

async function onSubmit() {
  errorMsg.value = ''
  busy.value = true
  try {
    await $fetch('/api/site-access/unlock', {
      method: 'POST',
      body: { password: password.value },
    })
    await router.replace(nextPath.value)
  } catch {
    errorMsg.value = 'Wrong password. Try again.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <FbaSection>
    <div class="mx-auto max-w-md">
      <FbaAppCard>
        <template #header>
          <div class="space-y-1">
            <h1 class="text-lg font-semibold text-highlighted">Site access</h1>
            <p class="text-sm text-muted">Enter the preview password to continue.</p>
          </div>
        </template>

        <UAlert
          v-if="errorMsg"
          color="error"
          variant="subtle"
          class="mb-4"
          :title="errorMsg"
        />

        <form class="space-y-4" @submit.prevent="onSubmit">
          <UInput
            v-model="password"
            type="password"
            name="site-access-password"
            autocomplete="current-password"
            placeholder="Password"
            size="lg"
            :disabled="busy"
          />
          <UButton type="submit" block size="lg" color="primary" :loading="busy">
            Continue
          </UButton>
        </form>
      </FbaAppCard>
    </div>
  </FbaSection>
</template>
