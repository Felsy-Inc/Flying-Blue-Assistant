import type { Locale } from '~lib/i18n/locales'

export type AlertEmailCopy = {
  brandName: string
  subjectRoute: string
  headline: string
  intro: string
  labels: {
    route: string
    tripType: string
    dates: string
    cabin: string
    miles: string
    milesMax: string
    taxes: string
    taxesNone: string
  }
  trip: { oneWay: string; roundTrip: string }
  cabin: {
    economy: string
    premium_economy: string
    business: string
    first: string
  }
  cta: string
  footer: string
  sampleBadge: string
  /** When a cron run finds new matching availability (distinct from static alert summary). */
  subjectNewMatches: string
  headlineMatch: string
  introMatch: string
}

const en: AlertEmailCopy = {
  brandName: 'AwardFlightAlert',
  subjectRoute: 'Award alert: {origin} → {destination}',
  headline: 'Your award alert',
  intro: 'Here is a summary of the alert we are watching for you.',
  labels: {
    route: 'Route',
    tripType: 'Trip',
    dates: 'Travel dates',
    cabin: 'Cabin',
    miles: 'Miles',
    milesMax: 'Max miles',
    taxes: 'Max taxes',
    taxesNone: '—',
  },
  trip: { oneWay: 'One way', roundTrip: 'Round trip' },
  cabin: {
    economy: 'Economy',
    premium_economy: 'Premium Economy',
    business: 'Business',
    first: 'First',
  },
  cta: 'View in app',
  footer: 'You are receiving this because alerts are enabled for your account.',
  sampleBadge: 'Preview',
  subjectNewMatches: 'New award options: {origin} → {destination}',
  headlineMatch: 'New options for your alert',
  introMatch: 'We found award availability that fits your alert criteria.',
}

const nl: AlertEmailCopy = {
  brandName: 'AwardFlightAlert',
  subjectRoute: 'Award alert: {origin} → {destination}',
  headline: 'Je award alert',
  intro: 'Hier is een samenvatting van de alert die we voor je monitoren.',
  labels: {
    route: 'Route',
    tripType: 'Reis',
    dates: 'Reisdata',
    cabin: 'Cabine',
    miles: 'Miles',
    milesMax: 'Max. miles',
    taxes: 'Max. belastingen',
    taxesNone: '—',
  },
  trip: { oneWay: 'Enkele reis', roundTrip: 'Retour' },
  cabin: {
    economy: 'Economy',
    premium_economy: 'Premium Economy',
    business: 'Business',
    first: 'First',
  },
  cta: 'Open in app',
  footer: 'Je ontvangt dit omdat alerts voor je account aan staan.',
  sampleBadge: 'Voorbeeld',
  subjectNewMatches: 'Nieuwe award-opties: {origin} → {destination}',
  headlineMatch: 'Nieuwe opties voor je alert',
  introMatch: 'We hebben awardbeschikbaarheid gevonden die bij je alert past.',
}

const fr: AlertEmailCopy = {
  brandName: 'AwardFlightAlert',
  subjectRoute: 'Alerte primes : {origin} → {destination}',
  headline: 'Votre alerte primes',
  intro: 'Voici le récapitulatif de l’alerte que nous surveillons pour vous.',
  labels: {
    route: 'Itinéraire',
    tripType: 'Voyage',
    dates: 'Dates de voyage',
    cabin: 'Cabine',
    miles: 'Miles',
    milesMax: 'Miles max',
    taxes: 'Taxes max',
    taxesNone: '—',
  },
  trip: { oneWay: 'Aller simple', roundTrip: 'Aller-retour' },
  cabin: {
    economy: 'Economy',
    premium_economy: 'Premium Economy',
    business: 'Business',
    first: 'First',
  },
  cta: 'Voir dans l’app',
  footer: 'Vous recevez cet e-mail car les alertes sont activées pour votre compte.',
  sampleBadge: 'Aperçu',
  subjectNewMatches: 'Nouvelles options primes : {origin} → {destination}',
  headlineMatch: 'Nouvelles options pour votre alerte',
  introMatch: 'Nous avons trouvé de la disponibilité correspondant à votre alerte.',
}

const byLocale: Record<Locale, AlertEmailCopy> = { en, nl, fr }

export function getAlertEmailCopy(locale: Locale): AlertEmailCopy {
  return byLocale[locale] ?? en
}
