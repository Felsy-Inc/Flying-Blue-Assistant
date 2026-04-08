<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { parseFetchError } from '~lib/api/fetch-error'
import { alertRowToFormValues, type AlertRow, type AlertUpsertBody } from '~lib/alerts/alert-schema'
import { alertPrefillFromRouteQuery } from '~lib/alerts/query-prefill'

definePageMeta({
  layout: 'app',
  i18n: false,
})

const { t } = useT()
const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const toast = useToast()

const displayTitle = useSeoDisplayTitle('seo.pageTitle.appAlerts')

useSeoMeta({
  title: () => t('seo.pageTitle.appAlerts'),
  ogTitle: () => displayTitle.value,
  description: () => t('seo.pageDescription.appAlerts'),
  ogDescription: () => t('seo.pageDescription.appAlerts'),
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => displayTitle.value,
  twitterDescription: () => t('seo.pageDescription.appAlerts'),
  ogSiteName: () => t('common.appName'),
})

const { data, refresh, status } = await useFetch<{ alerts: AlertRow[] }>('/api/app/alerts', {
  default: () => ({ alerts: [] }),
})

const { data: overview, refresh: refreshOverview } = await useAppOverview()

const showAlertsUpgrade = computed(() => overview.value?.planTier !== 'pro')
const activeAlertQuotaBlocked = computed(() => overview.value?.usage.activeAlertQuotaExhausted ?? false)

const editorOpen = ref(false)
const editorMode = ref<'create' | 'edit'>('create')
const editorId = ref<string | undefined>(undefined)
const editorInitial = ref<Partial<AlertUpsertBody> | null>(null)

const deleteTarget = ref<AlertRow | null>(null)
const deleteOpen = computed({
  get: () => deleteTarget.value != null,
  set: (v: boolean) => {
    if (!v) deleteTarget.value = null
  },
})

function openCreate(initial: Partial<AlertUpsertBody> | null = null) {
  editorMode.value = 'create'
  editorId.value = undefined
  editorInitial.value = initial
  editorOpen.value = true
}

function openEdit(row: AlertRow) {
  editorMode.value = 'edit'
  editorId.value = row.id
  editorInitial.value = alertRowToFormValues(row)
  editorOpen.value = true
}

function clearDelete() {
  deleteTarget.value = null
}

function consumeEditQueryFromRoute() {
  if (status.value !== 'success') return

  const q = route.query
  const rawEdit = q.edit
  const editId =
    typeof rawEdit === 'string'
      ? rawEdit
      : Array.isArray(rawEdit) && typeof rawEdit[0] === 'string'
        ? rawEdit[0]
        : undefined
  if (!editId) return

  const row = data.value?.alerts?.find((a) => a.id === editId)
  const next = { ...q }
  delete next.edit
  void router.replace(localePath({ path: '/app/alerts', query: next }))
  if (row) openEdit(row)
}

function consumeRouteEditorIntent() {
  const pre = alertPrefillFromRouteQuery(route.query as Record<string, unknown>)
  if (pre) {
    openCreate(pre)
    void router.replace(localePath({ path: '/app/alerts', query: {} }))
    return
  }

  const q = route.query
  const rawNew = q.new
  const wantsNewBlank =
    rawNew === '1' || rawNew === 'true' || (Array.isArray(rawNew) && rawNew[0] === '1')
  if (wantsNewBlank) {
    openCreate(null)
    const next = { ...q }
    delete next.new
    delete next.edit
    void router.replace(localePath({ path: '/app/alerts', query: next }))
    return
  }

  consumeEditQueryFromRoute()
}

onMounted(() => {
  consumeRouteEditorIntent()
})

watch(
  () => [route.fullPath, status.value, data.value?.alerts] as const,
  () => consumeRouteEditorIntent(),
)

async function syncLists() {
  await refresh()
  await refreshOverview()
}

async function pauseAlert(a: AlertRow) {
  try {
    await $fetch(`/api/app/alerts/${a.id}`, { method: 'PATCH', body: { status: 'paused' } })
    toast.add({ title: t('alerts.statusPaused'), color: 'neutral' })
    await syncLists()
  } catch {
    toast.add({ title: t('alerts.saveError'), color: 'error' })
  }
}

async function resumeAlert(a: AlertRow) {
  try {
    await $fetch(`/api/app/alerts/${a.id}`, { method: 'PATCH', body: { status: 'active' } })
    toast.add({ title: t('alerts.statusActive'), color: 'success' })
    await syncLists()
  } catch (e: unknown) {
    const err = parseFetchError(e)
    if (err.statusCode === 429) toast.add({ title: t('alerts.limitActive'), color: 'warning' })
    else toast.add({ title: t('alerts.saveError'), color: 'error' })
  }
}

async function confirmDelete() {
  const a = deleteTarget.value
  if (!a) return
  try {
    await $fetch(`/api/app/alerts/${a.id}`, { method: 'DELETE' })
    toast.add({ title: t('alerts.deleted'), color: 'success' })
    clearDelete()
    await syncLists()
  } catch {
    toast.add({ title: t('alerts.saveError'), color: 'error' })
  }
}

function requestDelete(x: AlertRow) {
  deleteTarget.value = x
}

const alerts = computed(() => data.value?.alerts ?? [])
</script>

<template>
  <div class="space-y-8">
    <FbaSection variant="app" :title="t('alerts.pageTitle')" :description="t('alerts.pageDesc')">
      <div class="mb-6 space-y-4">
        <FbaUsageLimitBanner
          kind="activeAlerts"
          :show="activeAlertQuotaBlocked"
          :show-upgrade-cta="showAlertsUpgrade"
        />
      </div>
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <UButton color="primary" size="lg" @click="openCreate(null)">
          {{ t('alerts.newAlert') }}
        </UButton>
        <UButton :to="localePath('/app/search')" color="neutral" variant="outline" size="lg">
          {{ t('app.nav.search') }}
        </UButton>
      </div>

      <FbaAppCard v-if="!alerts.length">
        <FbaEmptyState
          icon="i-heroicons-bell"
          :title="t('dashboard.alertsEmptyTitle')"
          :description="t('dashboard.alertsEmptyBody')"
        >
          <template #action>
            <UButton color="primary" size="sm" @click="openCreate(null)">
              {{ t('alerts.newAlert') }}
            </UButton>
          </template>
        </FbaEmptyState>
      </FbaAppCard>

      <ul v-else class="space-y-4">
        <li v-for="a in alerts" :key="a.id">
          <FbaAlertCard
            :alert="a"
            @edit="openEdit"
            @pause="pauseAlert"
            @resume="resumeAlert"
            @delete="requestDelete"
          />
        </li>
      </ul>
    </FbaSection>

    <FbaAlertEditor
      v-model:open="editorOpen"
      :mode="editorMode"
      :alert-id="editorId"
      :initial="editorInitial"
      @saved="syncLists()"
    />

    <UModal
      v-model:open="deleteOpen"
      :title="t('alerts.confirmDeleteTitle')"
      :description="t('alerts.confirmDeleteBody')"
    >
      <template #body>
        <div class="flex flex-wrap justify-end gap-2 pt-1">
          <UButton type="button" color="neutral" variant="ghost" @click="clearDelete">
            {{ t('alerts.cancel') }}
          </UButton>
          <UButton type="button" color="error" @click="confirmDelete">
            {{ t('alerts.confirmDeleteAction') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
