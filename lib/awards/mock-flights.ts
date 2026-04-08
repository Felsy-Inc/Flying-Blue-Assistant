/**
 * @deprecated Phase 5+ — award rows come from `lib/availability/mock-provider` via `/api/app/search`.
 * Kept for reference / possible storybook samples.
 */
export type MockCabin = 'economy' | 'premium' | 'business'

export type MockSeats = 'some' | 'few' | 'waitlist'

export type MockAwardRow = {
  id: string
  origin: string
  destination: string
  /** `YYYY-MM-DD` (local calendar date, Europe-oriented examples) */
  departDate: string
  cabin: MockCabin
  miles: number
  feesEur: number
  seats: MockSeats
}

/**
 * Static demo rows — not live inventory, not bookable.
 */
export const MOCK_AWARD_ROWS: MockAwardRow[] = [
  {
    id: 'demo-1',
    origin: 'AMS',
    destination: 'JFK',
    departDate: '2026-06-14',
    cabin: 'business',
    miles: 61500,
    feesEur: 312,
    seats: 'few',
  },
  {
    id: 'demo-2',
    origin: 'CDG',
    destination: 'SFO',
    departDate: '2026-07-03',
    cabin: 'premium',
    miles: 42800,
    feesEur: 198,
    seats: 'some',
  },
  {
    id: 'demo-3',
    origin: 'BRU',
    destination: 'DXB',
    departDate: '2026-05-22',
    cabin: 'economy',
    miles: 18500,
    feesEur: 142,
    seats: 'some',
  },
  {
    id: 'demo-4',
    origin: 'AMS',
    destination: 'NRT',
    departDate: '2026-09-08',
    cabin: 'business',
    miles: 91500,
    feesEur: 428,
    seats: 'waitlist',
  },
]
