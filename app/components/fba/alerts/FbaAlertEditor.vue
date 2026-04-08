<script setup lang="ts">
import { isApiValidationFailed, parseFetchError } from '~lib/api/fetch-error'
import type { AlertUpsertBody } from '~lib/alerts/alert-schema'

const props = defineProps<{
  mode: 'create' | 'edit'
  alertId?: string
  initial?: Partial<AlertUpsertBody> | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const open = defineModel<boolean>('open', { default: false })

const formRef = ref<InstanceType<typeof FbaAlertForm> | null>(null)

const { t } = useT()
const toast = useToast()

const title = computed(() => (props.mode === 'create' ? t('alerts.createTitle') : t('alerts.editTitle')))

const formKey = computed(() => `${props.mode}-${props.alertId ?? 'new'}-${String(open.value)}`)

async function onSubmit(body: AlertUpsertBody) {
  try {
    if (props.mode === 'create') {
      await $fetch('/api/app/alerts', { method: 'POST', body })
    } else if (props.alertId) {
      await $fetch(`/api/app/alerts/${props.alertId}`, { method: 'PATCH', body })
    }
    toast.add({ title: t('alerts.saved'), color: 'success' })
    open.value = false
    emit('saved')
  } catch (e: unknown) {
    const err = parseFetchError(e)
    if (err.statusCode === 429) {
      toast.add({ title: t('alerts.limitActive'), color: 'warning' })
    } else if (isApiValidationFailed(err)) {
      formRef.value?.applyServerFieldErrors(err.fieldErrors)
      toast.add({ title: t('alerts.validationFixFields'), color: 'warning' })
    } else {
      toast.add({ title: t('alerts.saveError'), color: 'error' })
    }
  }
}
</script>

<template>
  <!--
    Controlled slideover: v-model:open from parent. Nuxt UI renders DialogTrigger only when a
    default slot exists; without it, open state can fail to show. Keep a visually hidden stub.
  -->
  <USlideover v-model:open="open" side="right" :title="title" :description="t('alerts.editorDesc')">
    <button type="button" class="sr-only" tabindex="-1">.</button>
    <template #body>
      <div class="max-w-md space-y-4 p-4 sm:p-6">
        <FbaAlertForm ref="formRef" :key="formKey" :initial="initial" @submit="onSubmit" />
      </div>
    </template>
  </USlideover>
</template>
