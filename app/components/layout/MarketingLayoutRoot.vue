<script setup lang="ts">
import { computed } from 'vue'
import MarketingFooter from '~/components/layout/MarketingFooter.vue'
import MarketingHeader from '~/components/layout/MarketingHeader.vue'

const route = useRoute()
const isHome = computed(() => route.path === '/')

const { nuxtUiLocale } = useAppShellHead()
</script>

<template>
  <UApp :locale="nuxtUiLocale">
    <div class="fba-marketing-shell min-h-screen flex flex-col bg-default text-default">
      <MarketingHeader />
      <UMain class="flex-1">
        <div v-if="!isHome" class="py-10 md:py-12">
          <FbaPageContainer>
            <NuxtPage />
          </FbaPageContainer>
        </div>
        <NuxtPage v-else />
      </UMain>
      <MarketingFooter />
    </div>
  </UApp>
</template>
