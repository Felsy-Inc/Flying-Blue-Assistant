import type { AwardValueLabel, ValueTier } from './domain-models'

const LABEL_RANK: Record<AwardValueLabel, number> = {
  promo: 0,
  strong_value: 1,
  good: 2,
  fair: 3,
  high_surcharges: 4,
}

export function compareAwardValueLabels(a: AwardValueLabel, b: AwardValueLabel): number {
  return LABEL_RANK[a] - LABEL_RANK[b]
}

export function valueLabelToLegacyTier(label: AwardValueLabel): ValueTier {
  switch (label) {
    case 'promo':
    case 'strong_value':
      return 'great'
    case 'good':
      return 'good'
    case 'fair':
      return 'fair'
    case 'high_surcharges':
      return 'weak'
  }
}
