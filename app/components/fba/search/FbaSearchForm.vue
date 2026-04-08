<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { availabilitySearchBodySchema, type AvailabilitySearchBodyInput } from '~lib/availability/search-request.zod'

const props = withDefaults(
  defineProps<{
    /** True when daily search quota is exhausted (UI guard; API still enforces). */
    quotaBlocked?: boolean
    /** True while a search request is in flight (submit button + a11y). */
    submitting?: boolean
  }>(),
  { quotaBlocked: false, submitting: false },
)

const emit = defineEmits<{
  submit: [payload: AvailabilitySearchBodyInput]
}>()

const { t } = useT()

const hubs = ['AMS', 'BRU', 'CDG'] as const

const state = reactive({
  tripType: 'one_way' as 'one_way' | 'round_trip',
  origin: 'AMS',
  destination: '',
  outboundDate: '',
  returnDate: '',
  flexibilityDays: 0,
  passengers: 1,
  cabin: 'economy' as 'economy' | 'premium_economy' | 'business',
  maxMiles: '' as string | number,
  maxTaxesEur: '' as string | number,
  directOnly: false,
})

const fieldErrors = reactive<Record<string, string>>({})

const flexOptions = computed(() => [
  { value: 0, label: t('search.flex.d0') },
  { value: 1, label: t('search.flex.d1') },
  { value: 3, label: t('search.flex.d3') },
  { value: 7, label: t('search.flex.d7') },
  { value: 14, label: t('search.flex.d14') },
])

const cabinOptions = computed(() => [
  { value: 'economy', label: t('search.cabinOpt.economy') },
  { value: 'premium_economy', label: t('search.cabinOpt.premium_economy') },
  { value: 'business', label: t('search.cabinOpt.business') },
])

const tripItems = computed(() => [
  { value: 'one_way', label: t('search.tripOneWay') },
  { value: 'round_trip', label: t('search.tripRoundTrip') },
])

watch(
  () => state.tripType,
  (v) => {
    if (v === 'one_way') state.returnDate = ''
  },
)

function clearErrors() {
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
}

function mapFlattenedSearchErrors(flat: Record<string, string[] | undefined>) {
  const invalid = t('search.validation.formInvalid')
  if (flat.returnDate?.length) {
    const code = flat.returnDate[0]
    fieldErrors.returnDate =
      code === 'returnDate_required'
        ? t('search.validation.returnRequired')
        : code === 'return_after_outbound'
          ? t('search.validation.returnAfterOutbound')
          : invalid
  }
  if (flat.destination?.length) fieldErrors.destination = invalid
  if (flat.outboundDate?.length) fieldErrors.outboundDate = invalid
  if (flat.origin?.length) fieldErrors.origin = invalid
  if (flat.cabin?.length) fieldErrors.cabin = invalid
  if (flat.passengers?.length) fieldErrors.passengers = invalid
  if (flat.maxMiles?.length) fieldErrors.maxMiles = invalid
  if (flat.maxTaxesEur?.length) fieldErrors.maxTaxesEur = invalid
  if (flat.tripType?.length) fieldErrors.tripType = invalid
  if (flat.flexibilityDays?.length) fieldErrors.flexibilityDays = invalid
}

function applyServerFieldErrors(flat: Record<string, string[] | undefined> | undefined) {
  clearErrors()
  if (!flat) return
  mapFlattenedSearchErrors(flat)
}

function onSubmit() {
  if (props.quotaBlocked) return
  clearErrors()
  const maxMiles =
    state.maxMiles === '' || state.maxMiles === null
      ? undefined
      : Number(state.maxMiles)
  const maxTaxesEur =
    state.maxTaxesEur === '' || state.maxTaxesEur === null
      ? undefined
      : Number(state.maxTaxesEur)

  const raw = {
    origin: state.origin,
    destination: state.destination.trim(),
    tripType: state.tripType,
    outboundDate: state.outboundDate,
    returnDate: state.tripType === 'round_trip' ? state.returnDate || undefined : undefined,
    flexibilityDays: state.flexibilityDays,
    passengers: state.passengers,
    cabin: state.cabin,
    maxMiles: maxMiles !== undefined && !Number.isNaN(maxMiles) ? maxMiles : undefined,
    maxTaxesEur: maxTaxesEur !== undefined && !Number.isNaN(maxTaxesEur) ? maxTaxesEur : undefined,
    directOnly: state.directOnly,
  }

  const parsed = availabilitySearchBodySchema.safeParse(raw)
  if (!parsed.success) {
    mapFlattenedSearchErrors(parsed.error.flatten().fieldErrors)
    return
  }

  emit('submit', raw)
}

defineExpose({
  /** Seed form (e.g. from alert prefill). */
  applyPrefill(partial: Partial<typeof state>) {
    Object.assign(state, partial)
  },
  applyServerFieldErrors,
})
</script>

<template>
  <form
    class="space-y-6"
    :aria-busy="submitting ? 'true' : undefined"
    @submit.prevent="onSubmit"
  >
    <!-- Trip type -->
    <div class="fba-form-section p-4 ring-1 ring-default/5 dark:ring-white/[0.04] sm:p-5">
      <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-dimmed">
        {{ t('search.formGroupTrip') }}
      </h3>
      <UFormField :label="t('search.tripType')" :error="fieldErrors.tripType">
        <URadioGroup
          v-model="state.tripType"
          orientation="horizontal"
          variant="card"
          :items="tripItems"
        />
      </UFormField>
    </div>

    <!-- Route & dates -->
    <div class="fba-form-section p-4 ring-1 ring-default/5 dark:ring-white/[0.04] sm:p-5">
      <h3 class="mb-4 text-xs font-semibold uppercase tracking-wider text-dimmed">
        {{ t('search.formGroupRoute') }}
      </h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField :label="t('search.origin')" required :error="fieldErrors.origin">
          <USelect
            v-model="state.origin"
            :items="hubs.map((h) => ({ label: h, value: h }))"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="t('search.destination')"
          required
          :description="t('search.destinationHint')"
          :error="fieldErrors.destination"
        >
          <UInput
            v-model="state.destination"
            placeholder="JFK"
            maxlength="3"
            autocapitalize="characters"
            class="w-full uppercase"
          />
        </UFormField>
      </div>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <UFormField :label="t('search.outboundDate')" required :error="fieldErrors.outboundDate">
          <UInput v-model="state.outboundDate" type="date" class="w-full" />
        </UFormField>
        <UFormField
          v-if="state.tripType === 'round_trip'"
          :label="t('search.returnDate')"
          required
          :error="fieldErrors.returnDate"
        >
          <UInput v-model="state.returnDate" type="date" class="w-full" />
        </UFormField>
      </div>
    </div>

    <!-- Cabin & passengers -->
    <div class="fba-form-section p-4 ring-1 ring-default/5 dark:ring-white/[0.04] sm:p-5">
      <h3 class="mb-4 text-xs font-semibold uppercase tracking-wider text-dimmed">
        {{ t('search.formGroupParty') }}
      </h3>
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
        <UFormField :label="t('search.passengers')" :error="fieldErrors.passengers">
          <UInput
            v-model.number="state.passengers"
            type="number"
            min="1"
            max="9"
            class="w-full"
          />
        </UFormField>
      </div>
    </div>

    <!-- Flexibility -->
    <div class="fba-form-section p-4 ring-1 ring-default/5 dark:ring-white/[0.04] sm:p-5">
      <h3 class="mb-1 text-xs font-semibold uppercase tracking-wider text-dimmed">
        {{ t('search.formGroupFlex') }}
      </h3>
      <UFormField
        :label="t('search.flexibility')"
        :description="t('search.flexibilityHint')"
        :error="fieldErrors.flexibilityDays"
      >
        <USelect
          v-model="state.flexibilityDays"
          :items="flexOptions"
          value-key="value"
          label-key="label"
          class="w-full max-w-md"
        />
      </UFormField>
    </div>

    <!-- Advanced -->
    <div class="fba-search-advanced overflow-hidden rounded-2xl">
      <UCollapsible>
        <UButton
          color="neutral"
          variant="ghost"
          class="w-full justify-between rounded-none px-4 py-3.5 sm:px-5"
          type="button"
          :label="t('search.advanced')"
          trailing-icon="i-heroicons-chevron-down-20-solid"
          :ui="{ trailingIcon: 'transition group-data-[state=open]:rotate-180' }"
        />

        <template #content>
          <div class="space-y-4 border-t border-default/40 px-4 pb-5 pt-4 sm:px-5">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-dimmed">
              {{ t('search.formGroupAdvanced') }}
            </h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField :label="t('search.maxMiles')" :error="fieldErrors.maxMiles">
                <UInput v-model="state.maxMiles" type="number" min="1" class="w-full" placeholder="—" />
              </UFormField>
              <UFormField :label="t('search.maxTaxes')" :error="fieldErrors.maxTaxesEur">
                <UInput
                  v-model="state.maxTaxesEur"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full"
                  placeholder="—"
                />
              </UFormField>
            </div>
            <UCheckbox v-model="state.directOnly" :label="t('search.directOnly')" />
          </div>
        </template>
      </UCollapsible>
    </div>

    <!-- Actions -->
    <div
      class="flex flex-col gap-4 border-t border-default/50 pt-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="min-w-0 space-y-1">
        <p v-if="quotaBlocked" class="text-sm font-medium text-warning">
          {{ t('usage.searchSubmitBlockedHint') }}
        </p>
        <p v-else class="max-w-md text-sm leading-relaxed text-muted">
          {{ t('search.formActionsHint') }}
        </p>
      </div>
      <UButton
        type="submit"
        color="primary"
        size="lg"
        class="w-full shrink-0 sm:w-auto sm:min-w-[12rem]"
        :disabled="quotaBlocked"
        :loading="submitting"
      >
        {{ t('search.submit') }}
      </UButton>
    </div>
  </form>
</template>
