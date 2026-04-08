import {
  LOYALTY_PROGRAM_FLYING_BLUE,
  type AvailabilityItinerary,
  type AvailabilitySearchInput,
  type AvailabilitySearchResult,
  type AvailabilitySegment,
  type ProviderCapabilities,
  type TripType,
} from './domain-models'
import type { AvailabilitySearchResponse } from './domain'
import type { AvailabilityProvider } from './provider'
import { addCalendarDaysUtc, eachDateInclusive, parseIsoDateUtc } from './date-utils'
import { baselineMilesForRoute, computeAwardValueAssessment } from './scoring'
import { searchResultsToApiResponse } from './mappers'
import { compareAwardValueLabels } from './value-labels'

const AIRLINES = [
  { code: 'KL', name: 'KLM' },
  { code: 'AF', name: 'Air France' },
  { code: 'DL', name: 'Delta' },
] as const

const HUBS = ['CDG', 'AMS', 'BRU']

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFrom(parts: string[]): number {
  let h = 2166136261
  for (const p of parts) {
    for (let i = 0; i < p.length; i++) h = Math.imul(h ^ p.charCodeAt(i), 16777619)
  }
  return h >>> 0
}

function buildSegment(
  origin: string,
  destination: string,
  dayIso: string,
  startMinuteOfDay: number,
  durationMin: number,
  airlineIdx: number,
  flightNum: number,
): AvailabilitySegment {
  const day = parseIsoDateUtc(dayIso)
  const dep = new Date(day)
  dep.setUTCHours(Math.floor(startMinuteOfDay / 60), startMinuteOfDay % 60, 0, 0)
  const arr = new Date(dep.getTime() + durationMin * 60000)
  const airline = AIRLINES[airlineIdx % AIRLINES.length]!
  return {
    origin,
    destination,
    departureAt: dep.toISOString(),
    arrivalAt: arr.toISOString(),
    airlineCode: airline.code,
    airlineName: airline.name,
    flightNumber: `${airline.code}${flightNum}`,
    durationMinutes: durationMin,
  }
}

function buildOutboundLegs(
  origin: string,
  destination: string,
  dayIso: string,
  direct: boolean,
  rand: () => number,
): AvailabilityItinerary {
  if (direct) {
    const dur = 420 + Math.floor(rand() * 180)
    return {
      direction: 'outbound',
      stops: 0,
      segments: [
        buildSegment(
          origin,
          destination,
          dayIso,
          8 * 60 + rand() * 120,
          dur,
          Math.floor(rand() * 3),
          2000 + Math.floor(rand() * 800),
        ),
      ],
    }
  }
  const hub = HUBS[Math.floor(rand() * HUBS.length)]!
  const leg1 = 120 + Math.floor(rand() * 90)
  const leg2 = 360 + Math.floor(rand() * 200)
  const start = 7 * 60 + rand() * 240
  return {
    direction: 'outbound',
    stops: 1,
    segments: [
      buildSegment(origin, hub, dayIso, start, leg1, Math.floor(rand() * 3), 2100 + Math.floor(rand() * 200)),
      buildSegment(
        hub,
        destination,
        dayIso,
        start + leg1 + 60 + rand() * 90,
        leg2,
        Math.floor(rand() * 3),
        3100 + Math.floor(rand() * 200),
      ),
    ],
  }
}

function mirrorReturn(
  outbound: AvailabilitySegment[],
  returnDayIso: string,
  rand: () => number,
): AvailabilitySegment[] {
  return [...outbound].reverse().map((s, i) => {
    const airlineIdx = Math.floor(rand() * 3)
    const dur = s.durationMinutes + Math.floor((rand() - 0.5) * 40)
    return buildSegment(
      s.destination,
      s.origin,
      returnDayIso,
      10 * 60 + i * 180 + rand() * 90,
      Math.max(90, dur),
      airlineIdx,
      4000 + Math.floor(rand() * 500) + i,
    )
  })
}

function seatsFromRand(r: number): AvailabilitySearchResult['seatsAvailability'] {
  if (r < 0.35) return 'good'
  if (r < 0.7) return 'few'
  return 'waitlist'
}

function buildOffer(
  req: AvailabilitySearchInput,
  outboundDay: string,
  returnDay: string | null,
  variant: number,
): AvailabilitySearchResult {
  const rand = mulberry32(
    seedFrom([req.origin, req.destination, outboundDay, returnDay ?? '', String(variant), req.cabin]),
  )
  const direct = req.directOnly ? true : rand() > 0.35
  const outbound = buildOutboundLegs(req.origin, req.destination, outboundDay, direct, rand)
  const base = baselineMilesForRoute(req.origin, req.destination, req.cabin)
  const milesJitter = 0.72 + rand() * 0.45
  const outboundMiles = Math.round((base * milesJitter) / 100) * 100
  const taxBase = req.cabin === 'economy' ? 95 : req.cabin === 'premium_economy' ? 165 : 285
  const outboundTaxes = Math.round(taxBase + rand() * 220 + outbound.stops * 45)

  const idParts = [outboundDay, returnDay ?? 'ow', String(variant), req.cabin]
  const id = `mock-${idParts.join('-')}`

  let returnSegments: AvailabilitySegment[] | undefined
  let returnItin: AvailabilityItinerary | undefined
  let tripType: TripType = 'one_way'
  let totalMiles = outboundMiles
  let totalTaxes = outboundTaxes
  let stopsReturn = 0

  if (req.tripType === 'round_trip' && returnDay) {
    tripType = 'round_trip'
    returnSegments = mirrorReturn(outbound.segments, returnDay, rand)
    stopsReturn = Math.max(0, returnSegments.length - 1)
    returnItin = { direction: 'return', stops: stopsReturn, segments: returnSegments }
    const retMiles = Math.round(outboundMiles * (0.88 + rand() * 0.08))
    const retTax = Math.round(outboundTaxes * (0.85 + rand() * 0.12))
    totalMiles = outboundMiles + retMiles
    totalTaxes = outboundTaxes + retTax
  }

  const assessment = computeAwardValueAssessment(
    totalMiles,
    totalTaxes,
    req.cabin,
    req.origin,
    req.destination,
    tripType,
    outbound.stops,
    stopsReturn,
  )

  return {
    id,
    loyaltyProgramSlug: LOYALTY_PROGRAM_FLYING_BLUE,
    tripType,
    outboundDate: outboundDay,
    returnDate: returnDay,
    cabin: req.cabin,
    outbound,
    return: returnItin,
    price: {
      milesPerPassenger: totalMiles,
      taxes: { amount: totalTaxes, currency: 'EUR' },
    },
    seatsAvailability: seatsFromRand(rand()),
    assessment,
  }
}

function passesFilters(offer: AvailabilitySearchResult, req: AvailabilitySearchInput): boolean {
  if (req.maxMiles != null && offer.price.milesPerPassenger > req.maxMiles) return false
  if (req.maxTaxesEur != null && offer.price.taxes.amount > req.maxTaxesEur) return false
  if (req.directOnly && (offer.outbound.stops > 0 || (offer.return?.stops ?? 0) > 0)) return false
  return true
}

const MOCK_CAPABILITIES: ProviderCapabilities = {
  providerId: 'mock_flying_blue',
  loyaltyProgramSlug: LOYALTY_PROGRAM_FLYING_BLUE,
  dataSource: 'mock',
  supportsRoundTrip: true,
  supportsDateFlexibility: true,
  supportsCabinFilter: true,
  supportsDirectOnlyFilter: true,
  maxFlexibilityDays: 14,
}

export class MockAvailabilityProvider implements AvailabilityProvider {
  readonly id = MOCK_CAPABILITIES.providerId

  getCapabilities(): ProviderCapabilities {
    return { ...MOCK_CAPABILITIES }
  }

  async search(request: AvailabilitySearchInput): Promise<AvailabilitySearchResponse> {
    const flex = Math.min(14, Math.max(0, request.flexibilityDays))
    const startO = addCalendarDaysUtc(request.outboundDate, -flex)
    const endO = addCalendarDaysUtc(request.outboundDate, flex)
    const outboundDays = eachDateInclusive(startO, endO)

    let returnDays: string[] = []
    if (request.tripType === 'round_trip' && request.returnDate) {
      const startR = addCalendarDaysUtc(request.returnDate, -flex)
      const endR = addCalendarDaysUtc(request.returnDate, flex)
      returnDays = eachDateInclusive(startR, endR)
    }

    const results: AvailabilitySearchResult[] = []

    for (const od of outboundDays) {
      if (request.tripType === 'round_trip' && returnDays.length) {
        for (const rd of returnDays) {
          if (parseIsoDateUtc(rd) <= parseIsoDateUtc(od)) continue
          for (let v = 0; v < 4; v++) {
            const o = buildOffer(request, od, rd, v)
            if (passesFilters(o, request)) results.push(o)
          }
        }
      } else {
        for (let v = 0; v < 6; v++) {
          const o = buildOffer(request, od, null, v)
          if (passesFilters(o, request)) results.push(o)
        }
      }
    }

    results.sort(
      (a, b) =>
        compareAwardValueLabels(a.assessment.label, b.assessment.label) ||
        a.price.milesPerPassenger - b.price.milesPerPassenger,
    )

    const capped = results.slice(0, 72)

    return searchResultsToApiResponse(request, capped, {
      providerId: this.id,
      cacheHit: false,
    })
  }
}

export const mockAvailabilityProvider = new MockAvailabilityProvider()
