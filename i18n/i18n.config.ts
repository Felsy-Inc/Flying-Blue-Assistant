import { defineI18nConfig } from '#i18n'
import { en } from '../lib/i18n/messages/en'
import { fr } from '../lib/i18n/messages/fr'
import { nl } from '../lib/i18n/messages/nl'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    nl,
    fr,
  },
}))
