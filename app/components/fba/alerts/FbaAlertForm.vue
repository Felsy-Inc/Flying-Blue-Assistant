<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { alertUpsertBodySchema, type AlertUpsertBody } from '~lib/alerts/alert-schema'

const props = defineProps<{
  /** When set, form resets from these values (create prefill or edit load). */
  initial?: Partial<AlertUpsertBody> | null
}>()

const emit = defineEmits<{
  submit: [body: AlertUpsertBody]
}>()

const { t } = useT()

const hubs = ['AMS', 'BRU', 'CDG'] as const

const defaultState = (): Record<string, unknown> => ({
  loyalty_program_slug: 'flying_blue',
  origin_airport: 'AMS',
  destination_airport: '',
  trip_type: 'one_way',
  outbound_date_start: '',
  outbound_date_end: '',
  return_date_start: '',
  return_date_end: '',
  cabin: 'economy',
  passenger_count: 1,
  max_miles: '' as string | number | '',
  max_taxes_eur: '' as string | number | '',
  max_taxes_currency: 'EUR',
  direct_only: false,
  status: 'active',
})

const state = reactive(defaultState())

function applyInitial(v: Partial<AlertUpsertBody> | null | undefined) {
  Object.assign(state, defaultState())
  if (!v) return
  if (v.origin_airport != null) state.origin_airport = v.origin_airport
  if (v.destination_airport != null) state.destination_airport = v.destination_airport
  if (v.trip_type != null) state.trip_type = v.trip_type
  if (v.outbound_date_start != null) state.outbound_date_start = v.outbound_date_start
  if (v.outbound_date_end !== undefined) state.outbound_date_end = v.outbound_date_end ?? ''
  if (v.return_date_start !== undefined) state.return_date_start = v.return_date_start ?? ''
  if (v.return_date_end !== undefined) state.return_date_end = v.return_date_end ?? ''
  if (v.cabin != null) state.cabin = v.cabin
  if (v.passenger_count != null) state.passenger_count = v.passenger_count
  if (v.max_miles !== undefined && v.max_miles !== null) state.max_miles = v.max_miles
  if (v.max_taxes_eur !== undefined && v.max_taxes_eur !== null) state.max_taxes_eur = v.max_taxes_eur
  if (v.max_taxes_currency != null) state.max_taxes_currency = v.max_taxes_currency
  if (v.direct_only != null) state.direct_only = v.direct_only
  if (v.status != null) state.status = v.status
}

watch(
  () => props.initial,
  (v) => applyInitial(v),
  { immediate: true },
)

const fieldErrors = reactive<Record<string, string>>({})

const tripItems = computed(() => [
  { value: 'one_way', label: t('search.tripOneWay') },
  { value: 'round_trip', label: t('search.tripRoundTrip') },
])

const cabinOptions = computed(() => [
  { value: 'economy', label: t('search.cabinOpt.economy') },
  { value: 'premium_economy', label: t('search.cabinOpt.premium_economy') },
  { value: 'business', label: t('search.cabinOpt.business') },
  { value: 'first', label: t('alerts.cabinFirst') },
])

function clearErrors() {
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
}

function applyServerFieldErrors(flat: Record<string, string[] | undefined> | undefined) {
  clearErrors()
  if (!flat) return
  for (const [k, v] of Object.entries(flat)) {
    if (v?.[0]) fieldErrors[k] = t('alerts.validation.generic')
  }
}

function onSubmit() {
  clearErrors()
  const maxMiles =
    state.max_miles === '' || state.max_miles === null || state.max_miles === undefined
      ? undefined
      : Number(state.max_miles)
  const maxTaxes =
    state.max_taxes_eur === '' || state.max_taxes_eur === null || state.max_taxes_eur === undefined
      ? undefined
      : Number(state.max_taxes_eur)

  const raw = {
    loyalty_program_slug: 'flying_blue',
    origin_airport: state.origin_airport,
    destination_airport: String(state.destination_airport).trim(),
    trip_type: state.trip_type,
    outbound_date_start: state.outbound_date_start,
    outbound_date_end: state.outbound_date_end || null,
    return_date_start: state.return_date_start || null,
    return_date_end: state.return_date_end || null,
    cabin: state.cabin,
    passenger_count: state.passenger_count,
    max_miles: maxMiles !== undefined && !Number.isNaN(maxMiles) ? maxMiles : null,
    max_taxes_eur: maxTaxes !== undefined && !Number.isNaN(maxTaxes) ? maxTaxes : null,
    max_taxes_currency: state.max_taxes_currency,
    direct_only: state.direct_only,
    status: state.status,
  }

  const parsed = alertUpsertBodySchema.safeParse(raw)
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors
    for (const [k, v] of Object.entries(flat)) {
      if (v?.[0]) fieldErrors[k] = t('alerts.validation.generic')
    }
    return
  }

  emit('submit', parsed.data)
}

defineExpose({ applyInitial, applyServerFieldErrors })
</script>

<template>
  <form class="space-y-5" @submit.prevent="onSubmit">
    <UFormField :error="fieldErrors.trip_type">
      <URadioGroup
        v-model="state.trip_type"
        orientation="horizontal"
        variant="card"
        :items="tripItems"
      />
    </UFormField>

    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField :label="t('alerts.origin')" required :error="fieldErrors.origin_airport">
        <USelect
          v-model="state.origin_airport"
          :items="hubs.map((h) => ({ label: h, value: h }))"
          class="w-full"
        />
      </UFormField>
      <UFormField :label="t('alerts.destination')" required :error="fieldErrors.destination_airport">
        <UInput
          v-model="state.destination_airport"
          maxlength="3"
          class="w-full uppercase"
          placeholder="JFK"
        />
      </UFormField>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField :label="t('alerts.outboundStart')" required :error="fieldErrors.outbound_date_start">
        <UInput v-model="state.outbound_date_start" type="date" class="w-full" />
      </UFormField>
      <UFormField
        :label="t('alerts.outboundEnd')"
        :description="t('alerts.optionalEndDate')"
        :error="fieldErrors.outbound_date_end"
      >
        <UInput v-model="state.outbound_date_end" type="date" class="w-full" />
      </UFormField>
    </div>

    <div v-if="state.trip_type === 'round_trip'" class="grid gap-4 sm:grid-cols-2">
      <UFormField :label="t('alerts.returnStart')" required :error="fieldErrors.return_date_start">
        <UInput v-model="state.return_date_start" type="date" class="w-full" />
      </UFormField>
      <UFormField
        :label="t('alerts.returnEnd')"
        :description="t('alerts.optionalEndDate')"
        :error="fieldErrors.return_date_end"
      >
        <UInput v-model="state.return_date_end" type="date" class="w-full" />
      </UFormField>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField :label="t('search.cabin')" :error="fieldErrors.cabin">
        <USelect
          v-model="state.cabin"
          :items="cabinOptions"
          value-key="value"
          label-key="label"
          class="w-full"
        />
      </UFormField>
      <UFormField :label="t('search.passengers')" :error="fieldErrors.passenger_count">
        <UInput
          v-model.number="state.passenger_count"
          type="number"
          min="1"
          max="9"
          class="w-full"
        />
      </UFormField>
    </div>

    <UCollapsible>
      <UButton
        color="neutral"
        variant="ghost"
        class="w-full justify-between rounded-lg border border-default/40 bg-default/35 px-3 py-2.5 text-left dark:border-default/35 dark:bg-elevated/20"
        type="button"
        :label="t('search.advanced')"
        trailing-icon="i-heroicons-chevron-down-20-solid"
        :ui="{ trailingIcon: 'transition group-data-[state=open]:rotate-180' }"
      />
      <template #content>
        <div class="mt-4 space-y-4 border-t border-default/45 pt-4 dark:border-default/35">
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField :label="t('search.maxMiles')" :error="fieldErrors.max_miles">
              <UInput v-model="state.max_miles" type="number" min="1" class="w-full" placeholder="—" />
            </UFormField>
            <UFormField :label="t('search.maxTaxes')" :error="fieldErrors.max_taxes_eur">
              <UInput v-model="state.max_taxes_eur" type="number" min="0" step="1" class="w-full" placeholder="—" />
            </UFormField>
          </div>
          <UCheckbox v-model="state.direct_only" :label="t('search.directOnly')" />
        </div>
      </template>
    </UCollapsible>

    <UFormField :label="t('alerts.status')">
      <USelect
        v-model="state.status"
        :items="[
          { value: 'active', label: t('alerts.statusActive') },
          { value: 'paused', label: t('alerts.statusPaused') },
        ]"
        value-key="value"
        label-key="label"
        class="w-full max-w-xs"
      />
    </UFormField>

    <UButton type="submit" color="primary" block>
      {{ t('alerts.save') }}
    </UButton>
  </form>
</template>
