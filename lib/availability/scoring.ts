import type { AwardCabin, AwardValueAssessment, AwardValueLabel, TripType } from './domain-models'
import { valueLabelToLegacyTier } from './value-labels'

/** @deprecated Use `AwardValueLabel` + `valueLabelToLegacyTier` for new code. */
export type { ValueTier } from './domain-models'

/** Rough great-circle km (simplified sphere). */
function greatCircleKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const COORDS: Record<string, [number, number]> = {
  AMS: [52.31, 4.76],
  BRU: [50.9, 4.48],
  CDG: [49.01, 2.55],
  JFK: [40.64, -73.78],
  LAX: [33.94, -118.41],
  SFO: [37.62, -122.38],
  NRT: [35.77, 140.38],
  DXB: [25.25, 55.36],
  BKK: [13.69, 100.75],
  CPT: [-33.97, 18.6],
  GRU: [-23.43, -46.47],
}

function charCodeSum(s: string): number {
  return [...s.toUpperCase()].reduce((a, c) => a + c.charCodeAt(0), 0)
}

function approxDistanceKm(origin: string, destination: string): number {
  const o = COORDS[origin.toUpperCase()]
  const d = COORDS[destination.toUpperCase()]
  if (o && d) return greatCircleKm(o[0], o[1], d[0], d[1])
  const h = charCodeSum(origin) * 13 + charCodeSum(destination) * 17
  return 2000 + (h % 8500)
}

/**
 * Naive “typical” miles for route length + cabin (mock calibration, not airline truth).
 */
export function baselineMilesForRoute(origin: string, destination: string, cabin: AwardCabin): number {
  const km = approxDistanceKm(origin, destination)
  const perKm = cabin === 'economy' ? 7.2 : cabin === 'premium_economy' ? 11.5 : 24
  const raw = km * perKm
  return Math.max(4500, Math.round(raw / 500) * 500)
}

/**
 * Heuristic typical cash surcharges (EUR) for labeling “high surcharges” vs miles quality.
 */
export function typicalTaxesEur(
  cabin: AwardCabin,
  stopsOutbound: number,
  stopsReturn: number,
  tripType: TripType,
): number {
  const base = cabin === 'economy' ? 88 : cabin === 'premium_economy' ? 152 : 265
  const perStop = 42
  let total = base + stopsOutbound * perStop
  if (tripType === 'round_trip') {
    total += base + stopsReturn * perStop
    total = Math.round(total * 0.93)
  }
  return Math.max(55, total)
}

function pickLabel(
  milesRatio: number,
  taxRatio: number,
): { label: AwardValueLabel; milesRatioToBaseline: number; taxRatioToTypical: number } {
  const milesRatioToBaseline = milesRatio
  const taxRatioToTypical = taxRatio

  if (taxRatio >= 1.42 && milesRatio >= 0.82) {
    return { label: 'high_surcharges', milesRatioToBaseline, taxRatioToTypical }
  }
  if (milesRatio <= 0.68) {
    return { label: 'promo', milesRatioToBaseline, taxRatioToTypical }
  }
  if (milesRatio <= 0.84) {
    return { label: 'strong_value', milesRatioToBaseline, taxRatioToTypical }
  }
  if (milesRatio <= 0.97) {
    return { label: 'good', milesRatioToBaseline, taxRatioToTypical }
  }
  if (taxRatio >= 1.3) {
    return { label: 'high_surcharges', milesRatioToBaseline, taxRatioToTypical }
  }
  if (milesRatio <= 1.1) {
    return { label: 'fair', milesRatioToBaseline, taxRatioToTypical }
  }
  return { label: 'high_surcharges', milesRatioToBaseline, taxRatioToTypical }
}

/**
 * Score an award for display: Promo / Strong value / Good / Fair / High surcharges.
 * Uses miles vs route baseline and taxes vs a coarse typical surcharge model.
 */
export function computeAwardValueAssessment(
  milesPerPassenger: number,
  taxesAmount: number,
  cabin: AwardCabin,
  origin: string,
  destination: string,
  tripType: TripType,
  stopsOutbound: number,
  stopsReturn: number,
): AwardValueAssessment {
  const baseline = baselineMilesForRoute(origin, destination, cabin)
  const milesRatio = baseline > 0 ? milesPerPassenger / baseline : 1
  const taxTyp = typicalTaxesEur(cabin, stopsOutbound, stopsReturn, tripType)
  const taxRatio = taxTyp > 0 ? taxesAmount / taxTyp : 1
  return pickLabel(milesRatio, taxRatio)
}

/**
 * @deprecated Prefer `computeAwardValueAssessment` + `valueLabelToLegacyTier`.
 * Kept for any external code that still called the 4-bucket API directly.
 */
export function computeValueTier(
  milesPerPassenger: number,
  cabin: AwardCabin,
  origin: string,
  destination: string,
): import('./domain-models').ValueTier {
  const taxTyp = typicalTaxesEur(cabin, 0, 0, 'one_way')
  const a = computeAwardValueAssessment(
    milesPerPassenger,
    taxTyp,
    cabin,
    origin,
    destination,
    'one_way',
    0,
    0,
  )
  return valueLabelToLegacyTier(a.label)
}
